// ── LOLA SEO — Instagram Profile Proxy ───────────────────────────────────────
// Fetches public Instagram profile data server-side (avoids browser CORS block)
// Uses the undocumented but publicly accessible web_profile_info endpoint
// ─────────────────────────────────────────────────────────────────────────────

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { username } = req.query;
  if (!username || username.length < 1 || username.length > 60) {
    return res.status(400).json({ ok: false, error: 'Invalid username' });
  }

  // Sanitize: only alphanumeric, dots, underscores
  const clean = username.replace(/[^a-zA-Z0-9._]/g, '');
  if (!clean) return res.status(400).json({ ok: false, error: 'Invalid username' });

  try {
    const igRes = await fetch(
      `https://i.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(clean)}`,
      {
        headers: {
          'User-Agent': 'Instagram 123.0.0.21.114',
          'Accept': '*/*',
        },
        signal: AbortSignal.timeout(10000),
      }
    );

    if (igRes.status === 404) {
      return res.status(200).json({ ok: false, error: 'Profile not found', username: clean });
    }
    if (!igRes.ok) {
      return res.status(200).json({ ok: false, error: `Instagram returned ${igRes.status}`, username: clean });
    }

    const data = await igRes.json();
    const user = data?.data?.user;
    if (!user) {
      return res.status(200).json({ ok: false, error: 'No profile data returned', username: clean });
    }

    // ── Pull all useful fields ──────────────────────────────────────────────
    const followers   = user.edge_followed_by?.count ?? 0;
    const following   = user.edge_follow?.count ?? 0;
    const postCount   = user.edge_owner_to_timeline_media?.count ?? 0;
    const bio         = user.biography || '';
    const website     = user.external_url || '';
    const fullName    = user.full_name || clean;
    const isPrivate   = user.is_private || false;
    const isVerified  = user.is_verified || false;
    const isBusiness  = user.is_business_account || false;
    const isProfessional = user.is_professional_account || false;
    const highlightCount = user.highlight_reel_count || 0;
    const hasReels    = user.has_clips || false;
    const profilePicUrl = user.profile_pic_url || '';

    // ── Recent post analysis (up to 12 posts) ──────────────────────────────
    const edges = user.edge_owner_to_timeline_media?.edges || [];
    const now   = Math.floor(Date.now() / 1000);

    const posts = edges.map(e => {
      const n = e.node || {};
      const ts = n.taken_at_timestamp || 0;
      const daysAgo = ts ? Math.floor((now - ts) / 86400) : null;
      const likes = n.edge_liked_by?.count ?? n.edge_media_preview_like?.count ?? 0;
      const comments = n.edge_media_to_comment?.count ?? n.edge_media_preview_comment?.count ?? 0;
      const isVideo = n.is_video || n.__typename === 'GraphVideo';
      const isReel  = n.__typename === 'GraphVideo' && n.product_type === 'clips';
      const isCarousel = n.__typename === 'GraphSidecar';
      const captionEdges = n.edge_media_to_caption?.edges || [];
      const caption = captionEdges[0]?.node?.text || '';
      return { daysAgo, likes, comments, isVideo, isReel, isCarousel, caption: caption.slice(0, 80) };
    });

    // ── Derived metrics ─────────────────────────────────────────────────────
    const recentPosts  = posts.filter(p => p.daysAgo !== null && p.daysAgo <= 90);
    const last30Posts  = posts.filter(p => p.daysAgo !== null && p.daysAgo <= 30);

    // Posting frequency (posts per week, last 90 days)
    const postFreqPerWeek = recentPosts.length > 0
      ? +(recentPosts.length / 13).toFixed(1)   // 90 days = ~13 weeks
      : 0;

    // Last post date
    const mostRecentDaysAgo = posts.length > 0 && posts[0].daysAgo !== null ? posts[0].daysAgo : null;

    // Engagement rate (avg likes+comments / followers, last 12 posts)
    const engagementPosts = posts.filter(p => p.likes !== undefined);
    let avgLikes    = 0;
    let avgComments = 0;
    let engagementRate = 0;
    if (engagementPosts.length > 0) {
      avgLikes    = +(engagementPosts.reduce((s, p) => s + p.likes, 0)    / engagementPosts.length).toFixed(1);
      avgComments = +(engagementPosts.reduce((s, p) => s + p.comments, 0) / engagementPosts.length).toFixed(1);
      engagementRate = followers > 0
        ? +((avgLikes + avgComments) / followers * 100).toFixed(2)
        : 0;
    }

    // Content mix
    const videoCount    = posts.filter(p => p.isVideo).length;
    const carouselCount = posts.filter(p => p.isCarousel).length;
    const imageCount    = posts.filter(p => !p.isVideo && !p.isCarousel).length;
    const contentMix    = { video: videoCount, carousel: carouselCount, image: imageCount, total: posts.length };

    // Follower:following ratio
    const ffRatio = following > 0 ? +(followers / following).toFixed(2) : null;

    // Bio analysis
    const bioHasEmoji   = /\p{Emoji}/u.test(bio);
    const bioHasKeyword = /seo|marketing|local|service|coach|trainer|design|photo|video|real estate|contractor|cleaning|beauty|salon|medical|dental|fitness|restaurant/i.test(bio);
    const bioHasCity    = /tampa|miami|orlando|chicago|new york|houston|phoenix|dallas|austin|denver|atlanta|seattle|boston|las vegas|san diego|los angeles|charlotte|nashville|memphis|jacksonville|clearwater|st pete|sarasota|fort|fl|florida|ga|tx|ca|ny|nc/i.test(bio);
    const bioHasCTA     = /link|bio|book|call|dm|click|free|audit|follow|visit|shop|order|schedule/i.test(bio);
    const bioLength     = bio.length;

    return res.status(200).json({
      ok: true,
      username: clean,
      fullName,
      profilePicUrl,
      followers,
      following,
      postCount,
      bio,
      website,
      isPrivate,
      isVerified,
      isBusiness,
      isProfessional,
      highlightCount,
      hasReels,
      ffRatio,
      // Engagement
      avgLikes,
      avgComments,
      engagementRate,
      // Posting
      postFreqPerWeek,
      mostRecentDaysAgo,
      recentPostCount30: last30Posts.length,
      recentPostCount90: recentPosts.length,
      contentMix,
      // Bio flags
      bioLength,
      bioHasEmoji,
      bioHasKeyword,
      bioHasCity,
      bioHasCTA,
      // Recent posts (for Lola's analysis)
      posts: posts.slice(0, 12),
    });

  } catch (err) {
    console.error('ig-profile error:', err.message);
    return res.status(200).json({ ok: false, error: 'Could not reach Instagram. Try again in a moment.', username: clean });
  }
};

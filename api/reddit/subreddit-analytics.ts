import { VercelRequest, VercelResponse } from '@vercel/node';
import { withAuth, handleError, rateLimit } from '../_lib/auth';

// Fetch comprehensive subreddit analytics from Reddit API (top posts, heatmap, best times)
export default withAuth(async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Rate limit
  const userId = (req as any).user?.id || 'anonymous';
  if (!rateLimit(`reddit_analytics_${userId}`, 10, 60000)) {
    return res.status(429).json({ error: 'Too many Reddit API requests. Please try again later.', retry_after: 60 });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const subreddits: string[] = Array.isArray(body?.subreddits) ? body.subreddits : [];
    if (!subreddits.length || subreddits.length > 5) {
      return res.status(400).json({ error: 'Invalid subreddits array' });
    }

    const clean = (s: string) => s.replace(/^r\//i, '').toLowerCase().trim();
    const uniqueSubs = Array.from(new Set(subreddits.map(clean))).filter(Boolean);

    const results = await Promise.all(
      uniqueSubs.map(async (sub) => {
        try {
          const data = await fetchComprehensiveSubredditAnalytics(sub);
          return { subreddit: sub, success: true, data };
        } catch (e: any) {
          return { subreddit: sub, success: false, error: e?.message || 'Fetch failed' };
        }
      })
    );

    return res.status(200).json({ analytics: results, message: 'Comprehensive subreddit analytics fetched successfully' });
  } catch (error) {
    return handleError(res, error, 'Failed to fetch subreddit analytics');
  }
});

// -------- Internal helpers (ported from dev server) --------
const USER_AGENT = 'RedditPilot/1.0 (Marketing Tool)';
let redditTokenCache: { token: string; expiresAt: number } | null = (global as any).__rp_reddit_token_cache || null;

async function getRedditAccessToken(): Promise<string> {
  const clientId = process.env.REDDIT_CLIENT_ID;
  const clientSecret = process.env.REDDIT_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error('Missing Reddit credentials');
  const now = Date.now();
  if (redditTokenCache && redditTokenCache.expiresAt > now + 60_000) {
    return redditTokenCache.token;
  }
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const resp = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': USER_AGENT
    },
    body: new URLSearchParams({ grant_type: 'client_credentials' }).toString()
  });
  if (!resp.ok) throw new Error(`OAuth token request failed: ${resp.status}`);
  const data: any = await resp.json();
  const expiresIn = Number(data.expires_in || 3600);
  redditTokenCache = { token: data.access_token, expiresAt: Date.now() + (expiresIn - 60) * 1000 };
  (global as any).__rp_reddit_token_cache = redditTokenCache;
  return redditTokenCache.token;
}

async function fetchReddit(oauthPath: string, publicUrl: string, signal?: AbortSignal): Promise<Response> {
  const headersBase: Record<string, string> = { 'User-Agent': USER_AGENT };
  if (process.env.REDDIT_CLIENT_ID && process.env.REDDIT_CLIENT_SECRET) {
    try {
      const token = await getRedditAccessToken();
      const url = new URL(`https://oauth.reddit.com${oauthPath}`);
      url.searchParams.set('raw_json', '1');
      const r = await fetch(url.toString(), { headers: { ...headersBase, 'Authorization': `Bearer ${token}` }, signal });
      if (r.ok) return r;
    } catch {}
  }
  const u = new URL(publicUrl);
  u.searchParams.set('raw_json', '1');
  return fetch(u.toString(), { headers: headersBase, signal });
}

async function fetchComprehensiveSubredditAnalytics(subreddit: string) {
  // about
  const aboutController = new AbortController();
  const aboutTimeout = setTimeout(() => aboutController.abort(), 10000);
  const aboutResponse = await fetchReddit(`/r/${subreddit}/about`, `https://www.reddit.com/r/${subreddit}/about.json`, aboutController.signal);
  clearTimeout(aboutTimeout);
  if (!aboutResponse.ok) {
    if (aboutResponse.status === 404) throw new Error(`Subreddit r/${subreddit} not found or private`);
    if (aboutResponse.status === 403) throw new Error(`Subreddit r/${subreddit} is private or banned`);
    if (aboutResponse.status === 429) throw new Error(`Reddit API rate limit exceeded for r/${subreddit}`);
    throw new Error(`Reddit API error: ${aboutResponse.status}`);
  }
  const aboutData: any = await aboutResponse.json();
  const subredditData = aboutData.data;
  if (subredditData.subreddit_type === 'private') throw new Error(`Subreddit r/${subreddit} is private`);

  // posts
  const allPosts: any[] = [];
  for (let page = 0; page < 4; page++) {
    try {
      const after = page === 0 ? '' : `&after=${allPosts[allPosts.length - 1]?.name || ''}`;
      const postsController = new AbortController();
      const postsTimeout = setTimeout(() => postsController.abort(), 8000);
      const postsResponse = await fetchReddit(`/r/${subreddit}/top?t=month&limit=25${after}`, `https://www.reddit.com/r/${subreddit}/top.json?t=month&limit=25${after}`, postsController.signal);
      clearTimeout(postsTimeout);
      if (postsResponse.ok) {
        const postsData: any = await postsResponse.json();
        const posts = postsData.data.children.map((p: any) => p.data);
        allPosts.push(...posts);
        if (posts.length < 25) break;
      }
      await new Promise(r => setTimeout(r, 200));
    } catch {
      break;
    }
  }

  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  const monthlyPosts = allPosts.filter(p => new Date(p.created_utc * 1000) >= oneMonthAgo);
  return calculateComprehensiveAnalytics(subredditData, monthlyPosts);
}

function calculateComprehensiveAnalytics(subredditData: any, posts: any[]) {
  const scores = posts.map(p => p.score).filter((n: number) => n > 0);
  const avgScore = scores.length ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : 0;
  const activityHeatmap = Array(7).fill(null).map(() => Array(24).fill(0));
  posts.forEach(post => {
    const d = new Date(post.created_utc * 1000);
    activityHeatmap[d.getDay()][d.getHours()] += post.score || 1;
  });
  const dayTotals = activityHeatmap.map((day: number[], i: number) => ({ i, t: day.reduce((s, h) => s + h, 0) }));
  const bestDay = dayTotals.reduce((m, c) => (c.t > m.t ? c : m), dayTotals[0] || { i: 4, t: 0 }).i;
  const hourTotals = Array(24).fill(0);
  activityHeatmap.forEach((day: number[]) => day.forEach((v: number, h: number) => (hourTotals[h] += v)));
  const bestHour = hourTotals.indexOf(Math.max(...hourTotals));
  const topPosts = posts.sort((a, b) => b.score - a.score).slice(0, 5).map(p => ({
    title: p.title,
    score: p.score,
    num_comments: p.num_comments,
    url: p.url,
    created_utc: p.created_utc,
    author: p.author,
    permalink: `https://reddit.com${p.permalink}`,
    subreddit: p.subreddit
  }));
  const totalComments = posts.reduce((s, p) => s + (p.num_comments || 0), 0);
  const totalUpvotes = posts.reduce((s, p) => s + (p.score || 0), 0);
  const avgEngagementScore = posts.length ? Math.round(((totalComments + totalUpvotes) / posts.length) * 100) / 100 : 0;
  return {
    subscribers: subredditData.subscribers || 0,
    active_users: subredditData.active_user_count || subredditData.accounts_active || 0,
    subscriber_count: subredditData.subscribers || 0,
    activity_heatmap: activityHeatmap,
    best_posting_day: bestDay,
    best_posting_hour: bestHour,
    top_posts: topPosts,
    avg_engagement_score: avgEngagementScore,
    last_updated: new Date().toISOString(),
    analyzed_at: new Date().toISOString()
  };
}

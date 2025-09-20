import { Express } from 'express';
import { handleError } from '../index';

// Simple rate limiting store for Reddit API calls
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(identifier: string, maxRequests = 30, windowMs = 60000): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (record.count >= maxRequests) {
    return false;
  }
  
  record.count++;
  return true;
}

export function setupAnalyticsRoutes(app: Express) {
  // Analytics routes moved to frontend - Supabase operations handled directly
  // Backend provides fresh Reddit data analysis
  
  // Get live subreddit analysis from Reddit API
  app.get('/api/reddit/live-analytics/:subreddit', async (req, res) => {
    const { subreddit } = req.params;

    if (!subreddit) {
      return res.status(400).json({ error: 'Subreddit name is required' });
    }

    try {
      // Clean subreddit name
      const cleanSubreddit = subreddit.replace(/^r\//, '').toLowerCase();

      // Basic rate limiting (simple in-memory store)
      const rateLimitKey = `reddit_api_${req.ip}`;
      if (!checkRateLimit(rateLimitKey, 30, 60000)) { // 30 requests per minute
        return res.status(429).json({ 
          error: 'Too many Reddit API requests. Please try again in a minute.',
          retry_after: 60 
        });
      }

      // Fetch live analytics from Reddit API
      const analytics = await fetchLiveSubredditAnalytics(cleanSubreddit);

      res.status(200).json({
        subreddit: cleanSubreddit,
        analytics,
        timestamp: new Date().toISOString(),
        message: 'Live analytics fetched successfully'
      });

    } catch (error: any) {
      // Handle Reddit-specific errors
      if (error.message.includes('not found')) {
        return res.status(404).json({ error: error.message });
      }
      if (error.message.includes('private') || error.message.includes('banned')) {
        return res.status(403).json({ error: error.message });
      }
      if (error.message.includes('429') || error.message.includes('rate limit')) {
        return res.status(429).json({ 
          error: 'Reddit API rate limit exceeded. Please try again later.',
          retry_after: 300 // 5 minutes
        });
      }
      
      return handleError(res, error, 'Failed to fetch live analytics');
    }
  });
}

// Real Reddit API implementation with enhanced error handling
async function fetchLiveSubredditAnalytics(subreddit: string) {
  // Helper: attempt OAuth request if env vars provided; fallback to public endpoint
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
    if (!resp.ok) {
      throw new Error(`OAuth token request failed: ${resp.status}`);
    }
    const data = await resp.json() as any;
    const expiresIn = Number(data.expires_in || 3600);
    redditTokenCache = {
      token: data.access_token,
      expiresAt: Date.now() + (expiresIn - 60) * 1000
    };
    (global as any).__rp_reddit_token_cache = redditTokenCache;
    return redditTokenCache.token;
  }

  async function fetchReddit(oauthPath: string, publicUrl: string, signal?: AbortSignal): Promise<any> {
    const headersBase: Record<string, string> = { 'User-Agent': USER_AGENT };
    // Try OAuth first if credentials present
    if (process.env.REDDIT_CLIENT_ID && process.env.REDDIT_CLIENT_SECRET) {
      try {
        const token = await getRedditAccessToken();
        const url = new URL(`https://oauth.reddit.com${oauthPath}`);
        url.searchParams.set('raw_json', '1');
        const r = await fetch(url.toString(), { headers: { ...headersBase, 'Authorization': `Bearer ${token}` }, signal });
        if (r.ok) return r;
      } catch (e) {
        // Silent fallback
      }
    }
    // Fallback to public endpoint
    const u = new URL(publicUrl);
    u.searchParams.set('raw_json', '1');
    return fetch(u.toString(), { headers: headersBase, signal });
  }

  try {
    // Fetch subreddit about info with timeout
    const aboutController = new AbortController();
    const aboutTimeout = setTimeout(() => aboutController.abort(), 10000); // 10 second timeout

    const aboutResponse = await fetchReddit(
      `/r/${subreddit}/about`,
      `https://www.reddit.com/r/${subreddit}/about.json`,
      aboutController.signal
    );

    clearTimeout(aboutTimeout);

    if (!aboutResponse.ok) {
      if (aboutResponse.status === 404) {
        throw new Error(`Subreddit r/${subreddit} not found`);
      }
      if (aboutResponse.status === 403) {
        throw new Error(`Subreddit r/${subreddit} is private or banned`);
      }
      if (aboutResponse.status === 429) {
        throw new Error(`Reddit API rate limit exceeded`);
      }
      throw new Error(`Reddit API error: ${aboutResponse.status}`);
    }

    const aboutData = await aboutResponse.json() as any;
    const subredditData = aboutData.data;

    // Check if subreddit is accessible
    if (subredditData.subreddit_type === 'private') {
      throw new Error(`Subreddit r/${subreddit} is private`);
    }

    // Fetch recent posts for analysis with timeout
    const postsController = new AbortController();
    const postsTimeout = setTimeout(() => postsController.abort(), 10000);

    const postsResponse = await fetchReddit(
      `/r/${subreddit}/hot?limit=25`,
      `https://www.reddit.com/r/${subreddit}/hot.json?limit=25`,
      postsController.signal
    );

    clearTimeout(postsTimeout);

    let postsData: any = { data: { children: [] } };
    if (postsResponse.ok) {
      postsData = await postsResponse.json() as any;
    }

    const posts = postsData.data.children.map((post: any) => post.data);

    // Calculate analytics from real data
    const scores = posts.map((post: any) => post.score).filter((score: number) => score > 0);
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : 0;
    
    // Calculate posting patterns
    const postHours = posts.map((post: any) => {
      const date = new Date(post.created_utc * 1000);
      return date.getUTCHours();
    });

    const hourCounts: { [key: number]: number } = {};
    postHours.forEach((hour: number) => {
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const bestPostingTimes = Object.entries(hourCounts)
      .map(([hour, count]) => ({ hour: parseInt(hour), score: Math.round((count / posts.length) * 100) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);

    // Extract keywords from titles
    const titles = posts.map((post: any) => post.title.toLowerCase());
    const words = titles.join(' ').split(/\s+/).filter((word: string) => word.length > 3);
    const wordCounts: { [key: string]: number } = {};
    words.forEach((word: string) => {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    });

    const topKeywords = Object.entries(wordCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);

    return {
      subscribers: subredditData.subscribers || 0,
      active_users: subredditData.active_user_count || subredditData.accounts_active || 0,
      posts_per_day: Math.round((posts.length / 1) * 1), // Approximation based on hot posts
      avg_score: avgScore,
      engagement_rate: scores.length > 0 ? (avgScore / Math.max(subredditData.subscribers, 1000) * 100).toFixed(4) : '0.0000',
      top_keywords: topKeywords.length > 0 ? topKeywords : ['discussion', 'question', 'help'],
      posting_rules: {
        min_karma: 0, // Can't determine from API without auth
        min_account_age_days: 0, // Can't determine from API without auth
        requires_flair: subredditData.link_flair_enabled || false,
        text_posts_only: subredditData.submission_type === 'self' || false,
        link_posts_allowed: subredditData.submission_type === 'any' || subredditData.submission_type === 'link' || true,
        over_18: subredditData.over18 || false,
        public: subredditData.subreddit_type === 'public'
      },
      best_posting_times: bestPostingTimes.length > 0 ? bestPostingTimes : [
        { hour: 9, score: 75 },
        { hour: 14, score: 80 },
        { hour: 19, score: 85 }
      ],
      trending_topics: topKeywords.slice(0, 3),
      description: subredditData.public_description || subredditData.description || '',
      created_utc: subredditData.created_utc,
      language: subredditData.lang || 'en'
    };

  } catch (error: any) {
    console.error(`Reddit API error for r/${subreddit}:`, error.message);
    
    // Handle timeout errors
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout for r/${subreddit} - Reddit API is slow`);
    }
    
    // Handle network errors
    if (error.message.includes('fetch')) {
      throw new Error(`Network error accessing r/${subreddit}`);
    }
    
    // If Reddit API fails, return error with details
    throw new Error(`Failed to fetch data for r/${subreddit}: ${error.message}`);
  }
}
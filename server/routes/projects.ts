import { Express } from 'express';
import { withAuth, handleError, rateLimit, AuthenticatedRequest, validateSubredditAnalyticsRequest } from '../index';

export function setupProjectsRoutes(app: Express) {
  // All Supabase operations moved to frontend
  // Backend now handles only Reddit API and external services
  
  // Fetch comprehensive subreddit analytics for project creation
  app.post('/api/reddit/subreddit-analytics', withAuth(async (req: AuthenticatedRequest, res) => {
    // Rate limiting for Reddit API calls
    if (!rateLimit(`reddit_analytics_${req.user!.id}`, 10, 60000)) {
      return res.status(429).json({ 
        error: 'Too many Reddit API requests. Please try again later.',
        retry_after: 60 
      });
    }

    try {
      const validatedData = validateSubredditAnalyticsRequest(req.body);
      
      if (!validatedData) {
        return res.status(400).json({ error: 'Invalid subreddits array' });
      }

      const { subreddits } = validatedData;

      // Fetch comprehensive analytics for each subreddit from Reddit API
      const analyticsPromises = subreddits.map(async (subreddit: string) => {
        try {
          // Use real Reddit API to validate and fetch comprehensive data
          const analytics = await fetchComprehensiveSubredditAnalytics(subreddit);
          return {
            subreddit,
            success: true,
            data: analytics
          };
        } catch (error: any) {
          console.error(`Failed to fetch analytics for r/${subreddit}:`, error.message);
          return {
            subreddit,
            success: false,
            error: error.message || 'Failed to fetch subreddit data'
          };
        }
      });

      const results = await Promise.all(analyticsPromises);
      
      res.json({
        analytics: results,
        message: 'Comprehensive subreddit analytics fetched successfully'
      });

    } catch (error) {
      return handleError(res, error, 'Failed to fetch subreddit analytics');
    }
  }));
}

// Fetch comprehensive subreddit analytics from Reddit API (top 50 posts from last month)
async function fetchComprehensiveSubredditAnalytics(subreddit: string) {
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
    if (process.env.REDDIT_CLIENT_ID && process.env.REDDIT_CLIENT_SECRET) {
      try {
        const token = await getRedditAccessToken();
        const url = new URL(`https://oauth.reddit.com${oauthPath}`);
        url.searchParams.set('raw_json', '1');
        const r = await fetch(url.toString(), { headers: { ...headersBase, 'Authorization': `Bearer ${token}` }, signal });
        if (r.ok) return r;
      } catch (e) {
        // silent fallback
      }
    }
    const u = new URL(publicUrl);
    u.searchParams.set('raw_json', '1');
    return fetch(u.toString(), { headers: headersBase, signal });
  }

  try {
    // Fetch subreddit about info with timeout
    const aboutController = new AbortController();
    const aboutTimeout = setTimeout(() => aboutController.abort(), 10000);

    const aboutResponse = await fetchReddit(
      `/r/${subreddit}/about`,
      `https://www.reddit.com/r/${subreddit}/about.json`,
      aboutController.signal
    );

    clearTimeout(aboutTimeout);

    if (!aboutResponse.ok) {
      if (aboutResponse.status === 404) {
        throw new Error(`Subreddit r/${subreddit} not found or private`);
      }
      if (aboutResponse.status === 403) {
        throw new Error(`Subreddit r/${subreddit} is private or banned`);
      }
      if (aboutResponse.status === 429) {
        throw new Error(`Reddit API rate limit exceeded for r/${subreddit}`);
      }
      throw new Error(`Reddit API error: ${aboutResponse.status}`);
    }

    const aboutData = await aboutResponse.json() as any;
    const subredditData = aboutData.data;

    // Validate subreddit is accessible and public
    if (subredditData.subreddit_type === 'private') {
      throw new Error(`Subreddit r/${subreddit} is private`);
    }

    // Fetch top posts from the last month (multiple pages to get ~100 posts)
    const allPosts: any[] = [];
    
    // Get top posts from last month
    for (let page = 0; page < 4; page++) { // Get 4 pages of 25 posts each = 100 posts
      try {
        const after = page === 0 ? '' : `&after=${allPosts[allPosts.length - 1]?.name || ''}`;
        const postsController = new AbortController();
        const postsTimeout = setTimeout(() => postsController.abort(), 8000);

        const postsResponse = await fetchReddit(
          `/r/${subreddit}/top?t=month&limit=25${after}`,
          `https://www.reddit.com/r/${subreddit}/top.json?t=month&limit=25${after}`,
          postsController.signal
        );

        clearTimeout(postsTimeout);

        if (postsResponse.ok) {
          const postsData = await postsResponse.json() as any;
          const posts = postsData.data.children.map((post: any) => post.data);
          allPosts.push(...posts);
          
          // Break if we have enough posts or no more posts
          if (posts.length < 25) break;
        }
        
        // Add delay between requests to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.error(`Error fetching page ${page} for r/${subreddit}:`, error);
        break;
      }
    }

    // Filter posts from the last month only
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const monthlyPosts = allPosts.filter(post => {
      const postDate = new Date(post.created_utc * 1000);
      return postDate >= oneMonthAgo;
    });

    // Calculate comprehensive analytics
    const analytics = calculateComprehensiveAnalytics(subredditData, monthlyPosts);

    return analytics;

  } catch (error: any) {
    // Handle timeout errors
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout for r/${subreddit} - Reddit API is slow`);
    }
    
    // Handle network errors
    if (error.message.includes('fetch')) {
      throw new Error(`Network error accessing r/${subreddit}`);
    }
    
    // Re-throw Reddit API errors
    throw new Error(`Failed to fetch r/${subreddit}: ${error.message}`);
  }
}

// Calculate comprehensive analytics from Reddit data matching Supabase schema
function calculateComprehensiveAnalytics(subredditData: any, posts: any[]) {
  // Basic metrics
  const scores = posts.map(post => post.score).filter((score: number) => score > 0);
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : 0;
  
  // Calculate activity heatmap (24 hours x 7 days) - format for frontend visualization
  const activityHeatmap = Array(7).fill(null).map(() => Array(24).fill(0));
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  posts.forEach(post => {
    const date = new Date(post.created_utc * 1000);
    const day = date.getDay(); // 0 = Sunday
    const hour = date.getHours();
    activityHeatmap[day][hour] += post.score || 1; // Weight by score
  });

  // Find best posting day
  const dayTotals = activityHeatmap.map((day, index) => ({
    dayIndex: index, // 0 = Sunday, 1 = Monday, etc.
    dayName: dayNames[index],
    total: day.reduce((sum, hour) => sum + hour, 0)
  }));
  const bestDay = dayTotals.reduce((max, current) => current.total > max.total ? current : max);

  // Find best posting hour (across all days)
  const hourTotals = Array(24).fill(0);
  activityHeatmap.forEach(day => {
    day.forEach((hourActivity, hour) => {
      hourTotals[hour] += hourActivity;
    });
  });
  const bestHour = hourTotals.indexOf(Math.max(...hourTotals));

  // Get top 5 posts by score
  const topPosts = posts
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(post => ({
      title: post.title,
      score: post.score,
      num_comments: post.num_comments,
      url: post.url,
      created_utc: post.created_utc,
      author: post.author,
      permalink: `https://reddit.com${post.permalink}`,
      subreddit: post.subreddit
    }));

  // Calculate engagement metrics
  const totalComments = posts.reduce((sum, post) => sum + (post.num_comments || 0), 0);
  const totalUpvotes = posts.reduce((sum, post) => sum + (post.score || 0), 0);
  const avgEngagementScore = posts.length > 0 ? 
    Math.round(((totalComments + totalUpvotes) / posts.length) * 100) / 100 : 0;

  return {
    // Core metrics matching Supabase schema
    subscribers: subredditData.subscribers || 0,
    active_users: subredditData.active_user_count || subredditData.accounts_active || 0,
    subscriber_count: subredditData.subscribers || 0, // Alternative field name
    
    // Activity analysis
    activity_heatmap: activityHeatmap,
    best_posting_day: bestDay.dayIndex,  // Integer 0-6 (Sunday=0, Monday=1, etc.)
    best_posting_day_name: bestDay.dayName, // Human-readable day name
    best_posting_hour: bestHour,
    
    // Top content
    top_posts: topPosts,
    
    // Engagement metrics  
    avg_engagement_score: avgEngagementScore,
    avg_score: avgScore,
    
    // Analysis metadata
    total_posts_analyzed: posts.length,
    analysis_period: '30 days',
    posts_per_day: Math.round(posts.length / 30),
    
    // Additional insights
    top_keywords: extractKeywords(posts.map(post => post.title)),
    posting_rules: {
      min_karma: 0,
      requires_flair: subredditData.link_flair_enabled || false,
      text_posts_only: subredditData.submission_type === 'self',
      over_18: subredditData.over18 || false,
      public: subredditData.subreddit_type === 'public'
    },
    description: subredditData.public_description || '',
    language: subredditData.lang || 'en',
    created_utc: subredditData.created_utc,
    
    // Timestamps
    last_updated: new Date().toISOString(),
    analyzed_at: new Date().toISOString()
  };
}

// Helper function to extract keywords from titles
function extractKeywords(titles: string[]): string[] {
  if (!titles || titles.length === 0) return ['discussion', 'question', 'help'];
  
  const words = titles.join(' ').toLowerCase()
    .split(/\s+/)
    .filter((word: string) => word.length > 3 && !['this', 'that', 'with', 'from', 'they', 'have', 'been', 'what', 'when', 'where'].includes(word));
  
  const wordCounts: { [key: string]: number } = {};
  words.forEach((word: string) => {
    wordCounts[word] = (wordCounts[word] || 0) + 1;
  });

  return Object.entries(wordCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([word]) => word);
}
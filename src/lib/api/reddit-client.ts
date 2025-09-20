interface RedditPost {
  title: string;
  score: number;
  num_comments: number;
  url: string;
  created_utc: number;
  author: string;
}

interface SubredditInfo {
  display_name: string;
  subscribers: number;
  active_user_count: number;
  public_description: string;
}

interface RedditAPIResponse {
  data: {
    children: Array<{
      data: RedditPost | SubredditInfo;
    }>;
  };
}

interface SubredditAnalytics {
  subreddit: string;
  subscriber_count: number;
  active_users: number;
  activity_heatmap: number[][];
  best_posting_day: number;
  best_posting_hour: number;
  top_posts: Array<{
    title: string;
    score: number;
    comments: number;
    url: string;
    author: string;
  }>;
  avg_engagement_score: number;
}

class RedditAPIClient {
  private baseUrl = 'https://www.reddit.com';
  private userAgent = 'RedditPilot/1.0.0';
  private rateLimitDelay = 2000; // 2 seconds between requests
  private lastRequestTime = 0;

  private async makeRequest(endpoint: string): Promise<any> {
    // Rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.rateLimitDelay) {
      await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay - timeSinceLastRequest));
    }
    this.lastRequestTime = Date.now();

    const url = `${this.baseUrl}${endpoint}.json`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': this.userAgent,
        },
      });

      if (!response.ok) {
        throw new Error(`Reddit API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error fetching ${url}:`, error);
      throw error;
    }
  }

  async getSubredditInfo(subreddit: string): Promise<{ subscribers: number; active_users: number }> {
    const cleanSubreddit = subreddit.replace(/^r\//, '');
    const response = await this.makeRequest(`/r/${cleanSubreddit}/about`);
    
    const data = response.data as SubredditInfo;
    return {
      subscribers: data.subscribers || 0,
      active_users: data.active_user_count || 0,
    };
  }

  async getTopPosts(subreddit: string, timeframe = 'month', limit = 25): Promise<RedditPost[]> {
    const cleanSubreddit = subreddit.replace(/^r\//, '');
    const response: RedditAPIResponse = await this.makeRequest(
      `/r/${cleanSubreddit}/top?t=${timeframe}&limit=${limit}`
    );

    return response.data.children.map(child => child.data as RedditPost);
  }

  async getHotPosts(subreddit: string, limit = 25): Promise<RedditPost[]> {
    const cleanSubreddit = subreddit.replace(/^r\//, '');
    const response: RedditAPIResponse = await this.makeRequest(
      `/r/${cleanSubreddit}/hot?limit=${limit}`
    );

    return response.data.children.map(child => child.data as RedditPost);
  }

  async getNewPosts(subreddit: string, limit = 25): Promise<RedditPost[]> {
    const cleanSubreddit = subreddit.replace(/^r\//, '');
    const response: RedditAPIResponse = await this.makeRequest(
      `/r/${cleanSubreddit}/new?limit=${limit}`
    );

    return response.data.children.map(child => child.data as RedditPost);
  }

  private generateActivityHeatmap(posts: RedditPost[]): { heatmap: number[][]; bestDay: number; bestHour: number } {
    // Initialize 7x24 heatmap (days x hours)
    const heatmap: number[][] = Array(7).fill(null).map(() => Array(24).fill(0));
    
    posts.forEach(post => {
      const date = new Date(post.created_utc * 1000);
      const day = date.getUTCDay(); // 0=Sunday, 6=Saturday
      const hour = date.getUTCHours();
      
      // Weight by engagement (score + comments)
      const engagement = post.score + post.num_comments;
      heatmap[day][hour] += engagement;
    });

    // Find best posting time
    let maxActivity = 0;
    let bestDay = 0;
    let bestHour = 0;

    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        if (heatmap[day][hour] > maxActivity) {
          maxActivity = heatmap[day][hour];
          bestDay = day;
          bestHour = hour;
        }
      }
    }

    return { heatmap, bestDay, bestHour };
  }

  private calculateAverageEngagement(posts: RedditPost[]): number {
    if (posts.length === 0) return 0;
    
    const totalEngagement = posts.reduce((sum, post) => {
      return sum + post.score + post.num_comments;
    }, 0);
    
    return Math.round((totalEngagement / posts.length) * 100) / 100;
  }

  async analyzeSubreddit(subreddit: string): Promise<SubredditAnalytics> {
    try {
      console.log(`Starting analysis for r/${subreddit}`);
      
      // Get basic subreddit info
      const subredditInfo = await this.getSubredditInfo(subreddit);
      
      // Get posts from different time periods for better heatmap analysis
      const [topPosts, hotPosts, newPosts] = await Promise.all([
        this.getTopPosts(subreddit, 'month', 100),
        this.getHotPosts(subreddit, 50),
        this.getNewPosts(subreddit, 50)
      ]);

      // Combine all posts and remove duplicates
      const allPosts = [...topPosts, ...hotPosts, ...newPosts];
      const uniquePosts = allPosts.filter((post, index, self) => 
        index === self.findIndex(p => p.url === post.url)
      );

      // Generate activity heatmap
      const { heatmap, bestDay, bestHour } = this.generateActivityHeatmap(uniquePosts);
      
      // Calculate average engagement
      const avgEngagement = this.calculateAverageEngagement(uniquePosts);
      
      // Get top 5 posts for display
      const top5Posts = topPosts.slice(0, 5).map(post => ({
        title: post.title,
        score: post.score,
        comments: post.num_comments,
        url: post.url,
        author: post.author
      }));

      console.log(`Completed analysis for r/${subreddit}`);
      
      return {
        subreddit: subreddit.replace(/^r\//, ''),
        subscriber_count: subredditInfo.subscribers,
        active_users: subredditInfo.active_users,
        activity_heatmap: heatmap,
        best_posting_day: bestDay,
        best_posting_hour: bestHour,
        top_posts: top5Posts,
        avg_engagement_score: avgEngagement
      };
    } catch (error) {
      console.error(`Error analyzing subreddit r/${subreddit}:`, error);
      throw new Error(`Failed to analyze subreddit: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const redditClient = new RedditAPIClient();
export type { SubredditAnalytics, RedditPost };
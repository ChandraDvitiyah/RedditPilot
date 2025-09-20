import { VercelRequest, VercelResponse } from '@vercel/node';
import { handleError, supabase } from './_lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { subreddit } = req.query;

  if (!subreddit || typeof subreddit !== 'string') {
    return res.status(400).json({ error: 'Subreddit name is required' });
  }

  try {
    // Clean subreddit name
    const cleanSubreddit = subreddit.replace(/^r\//, '').toLowerCase();

    // Fetch analytics from database
    const { data: analytics, error } = await supabase
      .from('subreddit_analytics')
      .select('*')
      .eq('subreddit', cleanSubreddit)
      .single();

    if (error) {
      console.error('Error fetching analytics:', error);
      return res.status(404).json({ error: 'Analytics not found for this subreddit' });
    }

    return res.status(200).json({
      subreddit: analytics.subreddit,
      subscriber_count: analytics.subscriber_count,
      active_users: analytics.active_users,
      activity_heatmap: analytics.activity_heatmap,
      best_posting_day: analytics.best_posting_day,
      best_posting_hour: analytics.best_posting_hour,
      top_posts: analytics.top_posts,
      avg_engagement_score: analytics.avg_engagement_score,
      last_updated: analytics.last_updated
    });

  } catch (error) {
    return handleError(res, error, 'Failed to fetch analytics');
  }
}
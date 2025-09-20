import { VercelRequest, VercelResponse } from '@vercel/node';
import { withAuth, validateCreateProjectRequest, handleError, rateLimit, AuthenticatedRequest, supabase } from './_lib/auth';
import { redditClient, SubredditAnalytics } from '../src/lib/api/reddit-client';
import { timelineGenerator } from '../src/lib/api/timeline-generator';

async function getOrCreateSubredditAnalytics(subreddit: string): Promise<SubredditAnalytics> {
  // Check if analytics exist and are fresh (< 30 days old)
  const { data: existingAnalytics } = await supabase
    .from('subreddit_analytics')
    .select('*')
    .eq('subreddit', subreddit)
    .single();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  if (existingAnalytics && new Date(existingAnalytics.last_updated) > thirtyDaysAgo) {
    console.log(`Using cached analytics for r/${subreddit}`);
    return existingAnalytics;
  }

  // Fetch fresh analytics from Reddit
  console.log(`Fetching fresh analytics for r/${subreddit}`);
  const analytics = await redditClient.analyzeSubreddit(subreddit);

  // Save or update in database
  const { data, error } = await supabase
    .from('subreddit_analytics')
    .upsert({
      subreddit: analytics.subreddit,
      subscriber_count: analytics.subscriber_count,
      active_users: analytics.active_users,
      activity_heatmap: analytics.activity_heatmap,
      best_posting_day: analytics.best_posting_day,
      best_posting_hour: analytics.best_posting_hour,
      top_posts: analytics.top_posts,
      avg_engagement_score: analytics.avg_engagement_score,
      last_updated: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving analytics:', error);
    throw new Error('Failed to save analytics data');
  }

  return data;
}

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limiting
  if (!rateLimit(`projects_${req.user!.id}`, 5, 60000)) {
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }

  try {
    // Validate request body
    const projectData = validateCreateProjectRequest(req.body);
    if (!projectData) {
      return res.status(400).json({ error: 'Invalid project data' });
    }

    console.log(`Creating project: ${projectData.name} for user: ${req.user!.id}`);

    // Create project record
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        user_id: req.user!.id,
        name: projectData.name,
        description: projectData.description,
        karma_level: projectData.karma,
        target_subreddits: projectData.targetSubreddits,
        timezone: projectData.timezone,
        status: 'analyzing'
      })
      .select()
      .single();

    if (projectError) {
      console.error('Error creating project:', projectError);
      return res.status(500).json({ error: 'Failed to create project' });
    }

    // Return project immediately and process analytics in background
    res.status(201).json({
      message: 'Project created successfully',
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        karma_level: project.karma_level,
        target_subreddits: project.target_subreddits,
        timezone: project.timezone,
        status: project.status,
        created_at: project.created_at
      }
    });

    // Process analytics and timeline generation in background
    processProjectAnalytics(
      project.id, 
      project.name, 
      projectData.targetSubreddits, 
      projectData.karma, 
      projectData.timezone || 'UTC'
    ).catch(error => {
        console.error('Background processing error:', error);
        // Update project status to error
        supabase
          .from('projects')
          .update({ status: 'error' })
          .eq('id', project.id)
          .then(() => console.log(`Updated project ${project.id} status to error`));
      });

  } catch (error) {
    return handleError(res, error, 'Failed to create project');
  }
}

async function processProjectAnalytics(
  projectId: string,
  projectName: string,
  targetSubreddits: string[],
  karmaLevel: number,
  timezone: string
) {
  try {
    console.log(`Processing analytics for project: ${projectId}`);

    // Fetch analytics for all target subreddits
    const analyticsPromises = targetSubreddits.map(subreddit => 
      getOrCreateSubredditAnalytics(subreddit)
    );

    const allAnalytics = await Promise.allSettled(analyticsPromises);
    
    // Filter successful analytics
    const successfulAnalytics: SubredditAnalytics[] = [];
    allAnalytics.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successfulAnalytics.push(result.value);
      } else {
        console.error(`Failed to get analytics for ${targetSubreddits[index]}:`, result.reason);
      }
    });

    if (successfulAnalytics.length === 0) {
      throw new Error('Failed to get analytics for any subreddit');
    }

    // Generate timeline
    console.log(`Generating timeline for project: ${projectId}`);
    const timelineData = timelineGenerator.generateTimeline(
      projectId,
      projectName,
      targetSubreddits,
      karmaLevel,
      successfulAnalytics,
      timezone,
      90 // 90 day timeline
    );

    // Save timeline to database
    const { error: timelineError } = await supabase
      .from('project_timelines')
      .insert({
        project_id: projectId,
        user_id: (await supabase.from('projects').select('user_id').eq('id', projectId).single()).data?.user_id,
        timeline_data: timelineData
      });

    if (timelineError) {
      console.error('Error saving timeline:', timelineError);
      throw new Error('Failed to save timeline');
    }

    // Update project status to ready
    const { error: updateError } = await supabase
      .from('projects')
      .update({ status: 'ready' })
      .eq('id', projectId);

    if (updateError) {
      console.error('Error updating project status:', updateError);
      throw new Error('Failed to update project status');
    }

    console.log(`Successfully processed project: ${projectId}`);

  } catch (error) {
    console.error(`Error processing project ${projectId}:`, error);
    throw error;
  }
}

export default withAuth(handler);
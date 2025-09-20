import { VercelRequest, VercelResponse } from '@vercel/node';
import { withAuth, handleError, AuthenticatedRequest, supabase } from './_lib/auth';

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Fetch user's projects with latest status
    const { data: projects, error } = await supabase
      .from('projects')
      .select(`
        id,
        name,
        description,
        karma_level,
        target_subreddits,
        status,
        timezone,
        created_at,
        updated_at
      `)
      .eq('user_id', req.user!.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching projects:', error);
      return res.status(500).json({ error: 'Failed to fetch projects' });
    }

    // For each project, get progress information
    const projectsWithProgress = await Promise.all(
      projects.map(async (project) => {
        // Get timeline if project is ready
        if (project.status === 'ready' || project.status === 'active') {
          const { data: timeline } = await supabase
            .from('project_timelines')
            .select('timeline_data')
            .eq('project_id', project.id)
            .single();

          if (timeline) {
            const timelineData = timeline.timeline_data;
            let totalTasks = 0;
            let completedTasks = 0;

            if (Array.isArray(timelineData)) {
              // phases array
              for (const phase of timelineData) {
                if (!phase.tasks) continue;
                totalTasks += phase.tasks.length;
                completedTasks += (phase.tasks.filter((t: any) => t.status === 'completed').length || 0);
              }
            } else if (timelineData && Array.isArray(timelineData.items)) {
              totalTasks = timelineData.items.length;
              completedTasks = timelineData.items.filter((item: any) => item.status === 'completed').length;
            }

            return {
              ...project,
              progress: {
                totalTasks,
                completedTasks,
                percentage: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
              }
            };
          }
        }

        return {
          ...project,
          progress: {
            totalTasks: 0,
            completedTasks: 0,
            percentage: 0
          }
        };
      })
    );

    return res.status(200).json({
      projects: projectsWithProgress
    });

  } catch (error) {
    return handleError(res, error, 'Failed to fetch projects');
  }
}

export default withAuth(handler);
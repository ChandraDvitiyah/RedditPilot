import { VercelRequest, VercelResponse } from '@vercel/node';
import { withAuth, handleError, AuthenticatedRequest, supabase } from './_lib/auth';

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { projectId } = req.query;

  if (!projectId || typeof projectId !== 'string') {
    return res.status(400).json({ error: 'Project ID is required' });
  }

  try {
    // Verify project belongs to user
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, name, status, user_id')
      .eq('id', projectId)
      .eq('user_id', req.user!.id)
      .single();

    if (projectError || !project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (project.status !== 'ready' && project.status !== 'active') {
      return res.status(400).json({ 
        error: 'Timeline not ready yet', 
        status: project.status 
      });
    }

    // Fetch timeline data
    const { data: timeline, error: timelineError } = await supabase
      .from('project_timelines')
      .select('timeline_data, generated_at')
      .eq('project_id', projectId)
      .eq('user_id', req.user!.id)
      .single();

    if (timelineError || !timeline) {
      return res.status(404).json({ error: 'Timeline not found' });
    }

    return res.status(200).json({
      project: {
        id: project.id,
        name: project.name,
        status: project.status
      },
      timeline: timeline.timeline_data,
      generated_at: timeline.generated_at
    });

  } catch (error) {
    return handleError(res, error, 'Failed to fetch timeline');
  }
}

export default withAuth(handler);
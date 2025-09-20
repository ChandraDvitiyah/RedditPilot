import { VercelRequest, VercelResponse } from '@vercel/node';
import { withAuth, handleError, AuthenticatedRequest, supabase } from './_lib/auth';

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
  const { projectId } = req.query;

  if (!projectId || typeof projectId !== 'string') {
    return res.status(400).json({ error: 'Project ID is required' });
  }

  if (req.method === 'PATCH') {
    // Update timeline item status
    const { itemId, status } = req.body;

    if (!itemId || !status || !['pending', 'completed', 'skipped'].includes(status)) {
      return res.status(400).json({ error: 'Valid item ID and status required' });
    }

    try {
      // Verify project belongs to user and get timeline
      const { data: timeline, error: fetchError } = await supabase
        .from('project_timelines')
        .select('timeline_data')
        .eq('project_id', projectId)
        .eq('user_id', req.user!.id)
        .single();

      if (fetchError || !timeline) {
        return res.status(404).json({ error: 'Timeline not found' });
      }

      // Update the specific item status in timeline data
      const timelineData = timeline.timeline_data;

      let updatedItem: any = null;
      // New format: array of phases with tasks -> [{ id, title, tasks: [{id, title, status}] }]
      if (Array.isArray(timelineData)) {
        for (const phase of timelineData) {
          if (!phase.tasks) continue;
          const idx = phase.tasks.findIndex((t: any) => t.id === itemId);
          if (idx !== -1) {
            phase.tasks[idx].status = status;
            updatedItem = phase.tasks[idx];
            break;
          }
        }
      } else if (timelineData && Array.isArray(timelineData.items)) {
        // Legacy format: { items: [] }
        const itemIndex = timelineData.items.findIndex((item: any) => item.id === itemId);
        if (itemIndex !== -1) {
          timelineData.items[itemIndex].status = status;
          updatedItem = timelineData.items[itemIndex];
        }
      }

      if (!updatedItem) {
        return res.status(404).json({ error: 'Timeline item not found' });
      }

      // Save updated timeline
      const { error: updateError } = await supabase
        .from('project_timelines')
        .update({
          timeline_data: timelineData
        })
        .eq('project_id', projectId)
        .eq('user_id', req.user!.id);

      if (updateError) {
        console.error('Error updating timeline:', updateError);
        return res.status(500).json({ error: 'Failed to update timeline' });
      }

      // Update project status to active if first task completed
      let completedTasks = 0;
      if (Array.isArray(timelineData)) {
        for (const phase of timelineData) {
          if (!phase.tasks) continue;
          completedTasks += (phase.tasks.filter((t: any) => t.status === 'completed').length || 0);
        }
      } else if (timelineData && Array.isArray(timelineData.items)) {
        completedTasks = timelineData.items.filter((item: any) => item.status === 'completed').length;
      }

      if (completedTasks === 1 && status === 'completed') {
        await supabase
          .from('projects')
          .update({ status: 'active' })
          .eq('id', projectId);
      }

      return res.status(200).json({
        message: 'Timeline updated successfully',
        item: updatedItem
      });

    } catch (error) {
      return handleError(res, error, 'Failed to update timeline');
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

export default withAuth(handler);
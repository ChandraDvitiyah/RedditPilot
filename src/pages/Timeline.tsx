import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ArrowLeft, CheckCircle, Circle, Copy, Edit, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { loadProgress, saveProgress } from '@/lib/localProgress';
import { useAuth } from "@/contexts/AuthContext";

// Types for real project data
interface Project {
  id: string;
  name: string;
  target_subreddits: string[];
  karma_level: number;
  status: string;
  created_at: string;
  user_id: string;
}

interface TimelineTask {
  id: string;
  type: string;
  title: string;
  duration_days: number;
  order: number;
  subreddits: string[];
  status: string;
}

// Post templates
const postTemplates = {
  firstPost: {
    title: "Introduction Post Template",
    content: `Hey {subreddit}! 👋

I'm excited to share {project_name} with this amazing community!

🚀 What is {project_name}?
{project_name} is {project_description}

✨ Key features:
• {feature_1}
• {feature_2} 
• {feature_3}

🎯 Why I built this:
{personal_story}

Would love to hear your thoughts and feedback! 

{call_to_action}

#startup #entrepreneur #{industry}`
  },
  storyPost: {
    title: "Story/Journey Post Template", 
    content: `The story behind {project_name} 📖

It all started when {origin_story}

The journey wasn't easy:
❌ Challenge 1: {challenge_1}
❌ Challenge 2: {challenge_2}
❌ Challenge 3: {challenge_3}

But we persevered:
✅ Solution 1: {solution_1}
✅ Solution 2: {solution_2}
✅ Solution 3: {solution_3}

Today, {project_name} helps {target_audience} by {main_benefit}

What's your biggest challenge with {related_problem}?

{engagement_question}

#journey #startup #{industry}`
  },
  updatePost: {
    title: "Progress Update Template",
    content: `{project_name} Update! 🔥

Since my last post, here's what's new:

📈 Growth:
• {metric_1}: {value_1}
• {metric_2}: {value_2}
• {metric_3}: {value_3}

🆕 New Features:
• {new_feature_1}
• {new_feature_2}

👥 Community Feedback:
"{user_testimonial}"

🎯 What's Next:
• {upcoming_feature_1}
• {upcoming_feature_2}

{question_for_community}

Thanks for all the support, {subreddit}! 🙏

#update #progress #{industry}`
  },
  lessonPost: {
    title: "Lessons Learned Template",
    content: `5 lessons I learned building {project_name} 🧠

After {time_period} of building {project_name}, here are the biggest lessons:

1️⃣ {lesson_1_title}
{lesson_1_detail}

2️⃣ {lesson_2_title}
{lesson_2_detail}

3️⃣ {lesson_3_title}
{lesson_3_detail}

4️⃣ {lesson_4_title}
{lesson_4_detail}

5️⃣ {lesson_5_title}
{lesson_5_detail}

💭 What lessons have you learned in your journey?

{engagement_question}

#lessons #entrepreneur #startup #{industry}`
  }
};

interface PhaseTask {
  id: string;
  title: string;
  completed: boolean;
  description?: string;
  scheduled_at?: string; // UTC ISO timestamp
  scheduled_day?: number;
  scheduled_hour?: number;
  post_template?: string;
  details?: any;
  template?: string;
}

interface Phase {
  id: string;
  title: string;
  days: string;
  description: string;
  tasks: PhaseTask[];
  template?: keyof typeof postTemplates;
  completed: boolean;
}

const Timeline = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [timelineTasks, setTimelineTasks] = useState<TimelineTask[]>([]);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const [templateContent, setTemplateContent] = useState<string>("");

  // Fetch real project and timeline data
  useEffect(() => {
    const fetchProjectData = async () => {
      if (!projectId || !user) {
        setLoading(false);
        return;
      }

      try {
        // Fetch project data
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .eq('user_id', user.id)
          .single();

        if (projectError) {
          console.error('Error fetching project:', projectError);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Project not found or access denied",
          });
          setLoading(false);
          return;
        }

        setProject(projectData);

        // Fetch timeline tasks
        const { data: timelineData, error: timelineError } = await supabase
          .from('project_timelines')
          .select('timeline_data')
          .eq('project_id', projectId)
          .eq('user_id', user.id);

        if (timelineError) {
          console.error('Error fetching timeline:', timelineError);
        } else if (timelineData && timelineData.length > 0) {
          // Extract timeline tasks from stored data
          const tasks = timelineData.map(item => item.timeline_data);
          setTimelineTasks(tasks);
        }

        // If we have stored timeline rows, check whether they store phases (new format) or per-task rows (legacy)
        if (timelineData && timelineData.length > 0) {
          const firstRow = timelineData[0].timeline_data;
          // New format: single row contains an array of phases with tasks
          if (Array.isArray(firstRow) && firstRow.length > 0 && firstRow[0].tasks) {
            const phasesFromDb = firstRow;
            setPhases(phasesFromDb.map((p: any) => ({
              id: p.id,
              title: p.title,
              days: p.days || '',
              description: p.description || '',
              template: p.template,
              tasks: p.tasks.map((t: any) => ({
                id: t.id,
                title: t.title,
                completed: !!t.completed,
                description: t.description,
                scheduled_at: t.scheduled_at || t.scheduledAt || undefined,
                scheduled_day: typeof t.scheduled_day !== 'undefined' ? t.scheduled_day : (t.scheduled_day ?? t.scheduledDay ?? undefined),
                scheduled_hour: typeof t.scheduled_hour !== 'undefined' ? t.scheduled_hour : (t.scheduled_hour ?? t.scheduledHour ?? undefined),
                post_template: t.post_template || t.postTemplate || undefined,
                details: t.details || t._details || undefined,
                template: t.template || undefined
              })),
              completed: !!p.completed
            })));
          } else {
            // Legacy format: each row is a task
            const tasks = timelineData.map((item: any) => item.timeline_data);
            setTimelineTasks(tasks);
            initializePhases(projectData, tasks || []);
          }
        } else {
          // No stored timeline: initialize from scratch
          initializePhases(projectData, []);
        }

        // Apply any local saved progress for this project
        const saved = loadProgress(projectId);
        if (saved) {
          // saved is a map taskId -> boolean
          setPhases(prev => prev.map(phase => ({
            ...phase,
            tasks: phase.tasks.map(t => ({ ...t, completed: !!saved[t.id] })),
            completed: phase.tasks.every(t => !!saved[t.id])
          })));
        }

      } catch (error) {
        console.error('Error fetching project data:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load project data",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProjectData();
  }, [projectId, user]);

  // Initialize phases based on real project data
  const initializePhases = (projectData: Project, timelineData: any[]) => {
    const karmaLevel = projectData.karma_level;
    const progress = calculateProgress(timelineData);

    const defaultPhases: Phase[] = [
      {
        id: "phase1",
        title: "Phase 1: Community Engagement",
        days: "Days 1-3",
        description: "Build presence by engaging authentically with community discussions",
        completed: progress > 25,
        tasks: [
          { id: "task1", title: `Join r/${projectData.target_subreddits.join(', r/')}`, completed: progress > 10 },
          { id: "task2", title: "Read community rules and guidelines", completed: progress > 15 },
          { id: "task3", title: "Comment on 10+ posts per day", completed: progress > 20 },
          { id: "task4", title: "Provide value in discussions", completed: progress > 25 }
        ]
      },
      {
        id: "phase2", 
        title: "Phase 2: First Introduction Post",
        days: "Day 4",
        description: "Share your introduction and get initial community feedback",
        completed: progress > 50,
        template: "firstPost",
        tasks: [
          { id: "task5", title: "Craft introduction post", completed: progress > 35 },
          { id: "task6", title: `Post in ${projectData.target_subreddits.slice(0, 2).join(', ')}`, completed: progress > 45 },
          { id: "task7", title: "Respond to all comments", completed: progress > 50 }
        ]
      },
      {
        id: "phase3",
        title: "Phase 3: Story Post",
        days: "Day 7", 
        description: "Share your journey and build deeper connection",
        completed: progress > 75,
        template: "storyPost",
        tasks: [
          { id: "task8", title: "Write compelling origin story", completed: progress > 60 },
          { id: "task9", title: `Share in ${projectData.target_subreddits.slice(0, 3).join(', ')}`, completed: progress > 70 },
          { id: "task10", title: "Engage with story responses", completed: progress > 75 }
        ]
      },
      {
        id: "phase4",
        title: "Phase 4: Maintain Momentum",
        days: "Day 10+",
        description: "Maintain momentum with regular valuable posts",
        completed: progress > 90,
        tasks: [
          { id: "task11", title: "Post weekly updates", completed: progress > 80 },
          { id: "task12", title: "Share lessons learned", completed: progress > 85 },
          { id: "task13", title: "Build community relationships", completed: progress > 90 },
          { id: "task14", title: "Optimize posting strategy", completed: progress > 95 }
        ]
      }
    ];
    
    setPhases(defaultPhases);
  };

  // Calculate progress based on timeline data and task completion
  const calculateProgress = (timelineData: any[]): number => {
    if (timelineData.length === 0) return 0;
    
    const completedTasks = timelineData.filter(task => 
      task.timeline_data?.status === 'completed'
    ).length;
    
    return Math.round((completedTasks / timelineData.length) * 100);
  };

  const toggleTask = (phaseId: string, taskId: string) => {
    setPhases(prev => prev.map(phase => {
      if (phase.id === phaseId) {
        const updatedTasks = phase.tasks.map(task => 
          task.id === taskId ? { ...task, completed: !task.completed } : task
        );
        const allTasksCompleted = updatedTasks.every(task => task.completed);
        const newPhase = { ...phase, tasks: updatedTasks, completed: allTasksCompleted };

        // Persist local progress for this project
        try {
          // Build a map of taskId -> completed for all phases after update
          setTimeout(() => {
            setPhases(current => {
              // After state update, derive the map and save (use current state)
              const map: Record<string, boolean> = {};
              current.forEach(p => p.tasks.forEach(t => { map[t.id] = !!t.completed; }));
              if (projectId) saveProgress(projectId, map);
              return current;
            });
          }, 0);
        } catch (e) {
          console.error('Failed to persist local progress', e);
        }

        return newPhase;
      }
      return phase;
    }));
  };

  const copyTemplate = (templateKey: keyof typeof postTemplates) => {
    const template = postTemplates[templateKey];
    let content = template.content;
    
    // Replace placeholders with project data
    if (project) {
      content = content
        .replace(/{project_name}/g, project.name)
        .replace(/{subreddit}/g, project.target_subreddits[0] || "community")
        .replace(/{industry}/g, "tech");
    }
    
    navigator.clipboard.writeText(content);
    toast({
      title: "Template copied!",
      description: "Post template has been copied to your clipboard."
    });
  };

  const openTemplateEditor = (templateKey: keyof typeof postTemplates) => {
    const template = postTemplates[templateKey];
    let content = template.content;
    
    // Replace placeholders with project data
    if (project) {
      content = content
        .replace(/{project_name}/g, project.name)
        .replace(/{subreddit}/g, project.target_subreddits[0] || "community")
        .replace(/{industry}/g, "tech");
    }
    
    setTemplateContent(content);
    setEditingTemplate(templateKey);
  };

  const saveTemplateEdit = () => {
    navigator.clipboard.writeText(templateContent);
    toast({
      title: "Template saved and copied!",
      description: "Your edited template has been copied to clipboard."
    });
    setEditingTemplate(null);
    setTemplateContent("");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading project...</h1>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Project not found</h1>
          <p className="text-muted-foreground mb-4">The project you're looking for doesn't exist or you don't have access to it.</p>
          <Link to="/dashboard">
            <Button variant="brutal">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const completedPhases = phases.filter(phase => phase.completed).length;
  const overallProgress = (completedPhases / phases.length) * 100;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b-4 border-foreground bg-background px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/dashboard" className="flex items-center space-x-2 text-foreground hover:opacity-80 transition-opacity">
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Dashboard</span>
            </Link>
            <div className="w-px h-6 bg-foreground/20"></div>
            <h1 className="text-2xl font-bold text-foreground">{project.name} Timeline</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <Badge variant="secondary">{project.karma_level.toLocaleString()} karma target</Badge>
            <Badge variant="outline">{Math.round(overallProgress)}% complete</Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Project Overview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Project Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <span className="text-sm font-medium">Target Subreddits:</span>
              {project.target_subreddits.map((sub) => (
                <Link 
                  key={sub} 
                  to={`/analytics/${sub.replace("r/", "")}`}
                >
                  <Badge variant="secondary" className="text-xs hover:bg-secondary/80 cursor-pointer transition-colors">
                    r/{sub}
                  </Badge>
                </Link>
              ))}
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Overall Progress</span>
                <span className="text-sm text-muted-foreground">
                  {completedPhases}/{phases.length} phases completed
                </span>
              </div>
              <Progress value={overallProgress} className="h-3" />
            </div>
          </CardContent>
        </Card>

        {/* Timeline Phases */}
        <div className="space-y-6">
          {phases.map((phase, index) => (
            <Card key={phase.id} className={phase.completed ? "border-green-500" : ""}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {phase.completed ? (
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    ) : (
                      <Circle className="w-6 h-6 text-muted-foreground" />
                    )}
                    <div>
                      <CardTitle className="text-lg">{phase.title}</CardTitle>
                        {/* days badge removed per design request */}
                        <div style={{ width: 1 }} />
                    </div>
                  </div>
                  {/* Phase-level template buttons removed — copy lives inside each template card now */}
                </div>
                <p className="text-muted-foreground">{phase.description}</p>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Tasks Checklist */}
                <div className="space-y-2">
                  {phase.tasks.map((task) => {
                    // Format scheduled_at (UTC) to user's local time for display
                    let localTime: string | null = null;
                    if (task.scheduled_at) {
                      try {
                        const d = new Date(task.scheduled_at);
                        localTime = new Intl.DateTimeFormat(undefined, {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit'
                        }).format(d);
                      } catch (e) {
                        localTime = null;
                      }
                    } else if (typeof task.scheduled_day !== 'undefined' && typeof task.scheduled_hour !== 'undefined' && project) {
                      // Fallback: build UTC date from scheduled_day offset and scheduled_hour
                      try {
                        const now = new Date();
                        const d = new Date(now);
                        d.setUTCDate(now.getUTCDate() + Number(task.scheduled_day));
                        d.setUTCHours(Number(task.scheduled_hour), 0, 0, 0);
                        localTime = new Intl.DateTimeFormat(undefined, {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit'
                        }).format(d);
                      } catch (e) {
                        localTime = null;
                      }
                    }

                    return (
                      <div
                        key={task.id}
                        className="flex items-center justify-between space-x-3 p-2 rounded hover:bg-muted cursor-pointer"
                        onClick={() => toggleTask(phase.id, task.id)}
                      >
                        <div className="flex items-center space-x-3">
                          {task.completed ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <Circle className="w-5 h-5 text-muted-foreground" />
                          )}
                          <div>
                            <div className={task.completed ? "line-through text-muted-foreground" : ""}>
                              {task.title ?? 'Untitled task'}
                            </div>
                            {localTime ? (
                              <div className="text-xs text-muted-foreground">{localTime} (your local time)</div>
                            ) : (
                              (task.scheduled_day !== undefined || task.scheduled_hour !== undefined) && (
                                <div className="text-xs text-muted-foreground">Scheduled: {typeof task.scheduled_day !== 'undefined' && typeof task.scheduled_hour !== 'undefined' ? `${task.scheduled_day}d @ ${task.scheduled_hour}:00 UTC` : 'TBD'}</div>
                              )
                            )}
                          </div>
                        </div>
                        {/* Right-side: small badge with type or template */}
                        <div className="flex items-center space-x-2">
                          {task.post_template && (
                            <Badge variant="outline">Template</Badge>
                          )}
                          {task.scheduled_hour !== undefined && (
                            <div className="text-xs text-muted-foreground">{task.scheduled_hour}:00 UTC</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Template Previews: show one collapsible per task that has a post_template or template */}
                {phase.tasks.filter(t => t && (t.post_template || t.template)).map((task) => {
                  if (!task) return null;
                  const key = task.id + '-template';
                  const isOpen = expandedTemplate === key;
                  const templateObj = task.template ? (postTemplates as any)[task.template] : null;
                  const safeTitle = task.title ?? 'this item';
                  const title = task.post_template ? `Template for ${safeTitle}` : (templateObj ? templateObj.title : 'Template');
                  const content = task.post_template || (templateObj ? templateObj.content : '');
                  return (
                    <Collapsible key={key} open={isOpen} onOpenChange={(open) => setExpandedTemplate(open ? key : null)}>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" className="w-full justify-between mt-2">
                          <span>{title}</span>
                          {isOpen ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-2">
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base">{title}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            {content && content.trim() ? (
                              <>
                                <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded">
                                  {content
                                    .replace(/{project_name}/g, project?.name || '')
                                    .replace(/{subreddit}/g, project?.target_subreddits[0] || 'community')
                                    .replace(/{industry}/g, 'tech')}
                                </pre>
                                <div className="flex justify-end mt-2">
                                  <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(content.replace(/{project_name}/g, project?.name || '').replace(/{subreddit}/g, project?.target_subreddits[0] || 'community')); toast({ title: 'Copied!', description: 'Template copied to clipboard.' }); }}>
                                    <Copy className="w-4 h-4 mr-2" /> Copy
                                  </Button>
                                </div>
                              </>
                            ) : (
                              <div className="text-sm text-muted-foreground p-4 rounded bg-muted">No template available for this item.</div>
                            )}
                          </CardContent>
                        </Card>
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Template Editor Modal */}
        {editingTemplate && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-4xl max-h-[80vh] overflow-auto">
              <CardHeader>
                <CardTitle>Edit {postTemplates[editingTemplate].title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={templateContent}
                  onChange={(e) => setTemplateContent(e.target.value)}
                  rows={20}
                  className="font-mono text-sm"
                />
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setEditingTemplate(null)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={saveTemplateEdit}>
                    Save & Copy
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default Timeline;
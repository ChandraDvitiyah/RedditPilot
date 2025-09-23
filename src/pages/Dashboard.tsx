import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PricingSection from "@/components/pricing-section";
import { buildDodoPaymentLink } from "@/lib/dodo";
import { Plus, Target, TrendingUp, X, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useApiClient, Project } from "@/lib/api-client";
import { supabase } from "@/lib/supabase";

const Dashboard = () => {
  const { signOut, user, session } = useAuth();
  const apiClient = useApiClient();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [creatingProject, setCreatingProject] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [projectForm, setProjectForm] = useState({
    name: "",
    karma: "",
    targetSubreddits: [""]
  });

  // Convert actual Reddit karma to 1-5 scale
  const convertKarmaToScale = (karma: number): number => {
    if (karma < 100) return 1;
    if (karma < 200) return 2;
    if (karma < 300) return 3;
    if (karma < 500) return 4;
    return 5; // 500+ karma
  };

  // Fetch projects when user is available
  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  // Payment status refresh now handled in /payment page

  const fetchProjects = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Fetch projects directly from Supabase
      const { data: projects, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // For now, just set projects as fetched (no timeline progress)
      setProjects(projects || []);

    } catch (error: any) {
      console.error('Failed to fetch projects:', error);
      toast({
        title: "Error",
        description: "Failed to fetch projects",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubreddit = () => {
    setProjectForm(prev => {
      if (prev.targetSubreddits.length >= 5) return prev;
      return {
        ...prev,
        targetSubreddits: [...prev.targetSubreddits, ""]
      };
    });
  };

  const handleRemoveSubreddit = (index: number) => {
    setProjectForm(prev => ({
      ...prev,
      targetSubreddits: prev.targetSubreddits.filter((_, i) => i !== index)
    }));
  };

  const handleSubredditChange = (index: number, value: string) => {
    setProjectForm(prev => ({
      ...prev,
      targetSubreddits: prev.targetSubreddits.map((sub, i) => i === index ? value : sub)
    }));
  };

  const normalizeSubreddit = (input: string) => {
    if (!input) return "";
    let s = input.trim();
    // remove leading/trailing slashes
    s = s.replace(/^\/+|\/+$/g, "");
    // ensure starts with r/
    s = s.toLowerCase();
    if (!s.startsWith("r/")) s = `r/${s}`;
    // remove any duplicate slashes
    s = s.replace(/\/+/g, "/");
    return s;
  };

  const handleGeneratePlan = async () => {
    // Validate form
    if (!projectForm.name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a project name.",
        variant: "destructive"
      });
      return;
    }

    if (!projectForm.karma.trim() || isNaN(Number(projectForm.karma)) || Number(projectForm.karma) < 0) {
      toast({
        title: "Error",
        description: "Please enter a valid karma number (0 or higher).",
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create a project.",
        variant: "destructive"
      });
      return;
    }

    // Normalize and dedupe subreddit inputs
    const validSubreddits = projectForm.targetSubreddits.map(normalizeSubreddit).filter(s => s);
    const normalized = Array.from(new Set(validSubreddits));
    if (normalized.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one target subreddit.",
        variant: "destructive"
      });
      return;
    }

    if (normalized.length > 5) {
      toast({
        title: "Error",
        description: "Please limit target subreddits to 5 or fewer.",
        variant: "destructive"
      });
      return;
    }

    setCreatingProject(true);

    // --- Payment gating: check cached payment status first (30-day TTL) ---
    try {
      const cacheKey = `rp_payment_status_${user?.id}`;
      const cached = localStorage.getItem(cacheKey);
      let paymentStatus: string | null = null;
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.status && parsed.expiresAt && Date.now() < parsed.expiresAt) {
            paymentStatus = parsed.status;
          } else {
            // expired
            localStorage.removeItem(cacheKey);
          }
        } catch (e) {
          localStorage.removeItem(cacheKey);
        }
      }

      if (!paymentStatus) {
        // fetch from Supabase user_account table (strictly by user_id)
        const { data: accData, error: accErr } = await supabase
          .from('user_account')
          .select('payment_status')
          .eq('user_id', user!.id)
          .single();

        // Only accept values explicitly present on the user's row. Treat null/undefined as not eligible.
        if (!accErr && accData) {
          const statusVal = accData.payment_status ?? null;
          paymentStatus = statusVal;
          // cache for 30 days (cache whatever status is stored)
          const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
          localStorage.setItem(cacheKey, JSON.stringify({ status: paymentStatus, expiresAt }));
        }
      }

  const isPaid = String(paymentStatus || '').toLowerCase() === 'active';
      if (!isPaid) {
        // show pricing modal and abort project creation
        setShowPricingModal(true);
        setCreatingProject(false);
        return;
      }
    } catch (err) {
      console.error('Payment check failed:', err);
      // Fail open? we'll treat as not paid and show pricing
      setShowPricingModal(true);
      setCreatingProject(false);
      return;
    }

    try {
      const actualKarma = Number(projectForm.karma);
      const karmaScale = convertKarmaToScale(actualKarma);
      
      // Step 1: Check for existing analytics in Supabase first
      toast({
        title: "Checking Analytics...",
        description: "Looking for existing subreddit data",
      });

      const cleanSubreddits = normalized.map(sub => sub.replace(/^r\//, ''));
      
      // Check which subreddits already have analytics
      const { data: existingAnalytics, error: analyticsError } = await supabase
        .from('subreddit_analytics')
        .select('subreddit, *')
        .in('subreddit', cleanSubreddits);

      if (analyticsError) {
        console.error('Error checking existing analytics:', analyticsError);
      }

      const existingSubreddits = new Set(existingAnalytics?.map(a => a.subreddit) || []);
      const missingSubreddits = cleanSubreddits.filter(sub => !existingSubreddits.has(sub));

      let fetchedAnalytics: any[] = [];

      // Step 2: Fetch analytics for missing subreddits from backend if needed
      if (missingSubreddits.length > 0) {
        toast({
          title: "Analyzing Subreddits...",
          description: `Fetching detailed analytics for ${missingSubreddits.length} subreddits`,
        });

        const analyticsResp = await fetch('/api/reddit/subreddit-analytics', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
          },
          body: JSON.stringify({ subreddits: missingSubreddits }),
        });

        if (!analyticsResp.ok) {
          throw new Error('Failed to fetch subreddit analytics');
        }

        const analyticsData = await analyticsResp.json();
        fetchedAnalytics = (analyticsData?.analytics || []).filter((result: any) => result.success);

        // Step 3: Store new analytics in Supabase
        if (fetchedAnalytics.length > 0) {
          toast({
            title: "Storing Analytics...",
            description: "Saving analytics data to database",
          });


          // Normalize types and prepare payload for upsert with safety checks
          const clampToPrecision = (val: number, maxAbs = 999.99) => {
            if (!isFinite(val)) return 0;
            const clamped = Math.max(Math.min(val, maxAbs), -maxAbs);
            return Math.round(clamped * 100) / 100; // 2 decimal places
          };

          const safeParseJson = (v: any) => {
            if (v == null) return null;
            if (typeof v === 'string') {
              try { return JSON.parse(v); } catch (e) { return null; }
            }
            return v;
          };

          const analyticsInserts = fetchedAnalytics.map((result: any) => {
            // ensure integer types fit int4
            const subscriber_count = Math.min(2147483647, Math.floor(Number(result.data.subscribers ?? result.data.subscriber_count ?? 0) || 0));
            const active_users = Math.min(2147483647, Math.floor(Number(result.data.active_users ?? 0) || 0));

            const activity_heatmap = safeParseJson(result.data.activity_heatmap);
            const top_posts = safeParseJson(result.data.top_posts);

            const best_posting_day = result.data.best_posting_day !== undefined && result.data.best_posting_day !== null
              ? Number(result.data.best_posting_day)
              : null;

            const best_posting_hour = result.data.best_posting_hour !== undefined && result.data.best_posting_hour !== null
              ? Number(result.data.best_posting_hour)
              : null;

            let avg_engagement_score = result.data.avg_engagement_score !== undefined && result.data.avg_engagement_score !== null
              ? Number(result.data.avg_engagement_score)
              : 0;
            if (isNaN(avg_engagement_score)) avg_engagement_score = 0;
            // clamp to numeric(5,2) allowed range and round to 2 decimals
            avg_engagement_score = clampToPrecision(avg_engagement_score, 999.99);

            return {
              subreddit: result.subreddit,
              subscriber_count,
              active_users,
              activity_heatmap,
              best_posting_day,
              best_posting_hour,
              top_posts,
              avg_engagement_score,
              last_updated: new Date().toISOString()
            };
          });

          console.log('Prepared analytics payload for upsert:', analyticsInserts);

          // Use upsert with onConflict to insert or update existing rows in one batch
          const { data: upserted, error: storeError } = await supabase
            .from('subreddit_analytics')
            .upsert(analyticsInserts, { onConflict: 'subreddit' });

          if (storeError) {
            console.error('Failed to upsert analytics:', storeError);
            console.error('Analytics payload that failed:', analyticsInserts);
            toast({
              variant: "destructive",
              title: "Analytics Storage Warning",
              description: "Analytics data couldn't be saved, but project will continue",
            });
            // Continue anyway - we have the data in memory
          } else {
            const upsertedCount = upserted != null && Array.isArray(upserted) ? (upserted as any).length : (fetchedAnalytics.length || 0);
            console.log('Successfully upserted analytics for', upsertedCount, 'subreddits');
          }
        }
      }

      // Step 4: Create project with Supabase
      toast({
        title: "Creating Project...",
        description: "Setting up your Reddit marketing project",
      });

      const projectData = {
        user_id: user.id,
        name: projectForm.name.trim(),
        target_subreddits: cleanSubreddits,
        karma_level: karmaScale,
        status: 'analyzing',
        created_at: new Date().toISOString()
      };

      const { data: project, error } = await supabase
        .from('projects')
        .insert(projectData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Step 5: Generate timeline based on analytics
      toast({
        title: "Generating Timeline...",
        description: "Creating your personalized marketing timeline",
      });

      let timelineTasks: any[] = [];
      try {
        // Fetch all analytics for this project's subreddits
        const { data: allAnalytics } = await supabase
          .from('subreddit_analytics')
          .select('*')
          .in('subreddit', cleanSubreddits);

        // Parse JSON fields to ensure the timeline generator receives proper objects
        const parsedAnalytics = (allAnalytics || []).map((a: any) => ({
          ...a,
          activity_heatmap: typeof a.activity_heatmap === 'string' ? (() => { try { return JSON.parse(a.activity_heatmap); } catch { return null; } })() : a.activity_heatmap,
          top_posts: typeof a.top_posts === 'string' ? (() => { try { return JSON.parse(a.top_posts); } catch { return null; } })() : a.top_posts,
        }));

        // Generate timeline using backend service
        const timelineResp = await fetch('/api/reddit/generate-timeline', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
          },
          body: JSON.stringify({
            projectId: project.id,
            subreddits: cleanSubreddits,
            karmaLevel: karmaScale,
            analytics: allAnalytics || [],
          }),
        });

        if (timelineResp.ok) {
          const timelineData = await timelineResp.json();
          const generated = timelineData.timeline || timelineData.phases || [];

          // If backend returned phases (array of phases with tasks), store as a single row
          if (Array.isArray(generated) && generated.length > 0 && generated[0].tasks) {
            const { error: timelineError } = await supabase
              .from('project_timelines')
              .insert([{ project_id: project.id, user_id: user.id, timeline_data: generated, generated_at: new Date().toISOString() }]);

            if (timelineError) {
              console.error('Timeline storage error:', timelineError);
              toast({
                variant: "destructive",
                title: "Timeline Warning",
                description: "Timeline couldn't be saved, but project was created",
              });
            }
            timelineTasks = generated.flatMap((p: any) => p.tasks || []);
          } else {
            timelineTasks = generated;

            // Store timeline in Supabase (legacy: one row per task)
            if (timelineTasks.length > 0) {
              const timelineInserts = timelineTasks.map((task: any, index: number) => ({
                project_id: project.id,
                user_id: user.id,
                timeline_data: task,
                generated_at: new Date().toISOString()
              }));

              const { error: timelineError } = await supabase
                .from('project_timelines')
                .insert(timelineInserts);

              if (timelineError) {
                console.error('Timeline storage error:', timelineError);
                toast({
                  variant: "destructive",
                  title: "Timeline Warning",
                  description: "Timeline couldn't be saved, but project was created",
                });
              }
            }
          }
        } else {
          console.error('Timeline generation failed:', timelineResp.status);
          toast({
            variant: "destructive",
            title: "Timeline Warning", 
            description: "Timeline generation failed, but project was created",
          });
        }
      } catch (timelineError) {
        console.error('Timeline generation error:', timelineError);
        toast({
          variant: "destructive",
          title: "Timeline Warning",
          description: "Timeline generation failed, but project was created",
        });
      }

      // Step 6: Update project status to ready
      const { error: updateError } = await supabase
        .from('projects')
        .update({ status: 'ready' })
        .eq('id', project.id);

      if (updateError) {
        console.error('Project status update error:', updateError);
        // Continue anyway - project was created
      }

      const totalAnalytics = (existingAnalytics?.length || 0) + fetchedAnalytics.length;
      
      toast({
        title: "Project Created!",
        description: `${projectForm.name} created with ${totalAnalytics} subreddit analytics and ${timelineTasks.length} timeline tasks.`,
      });

      // Reset form and close modal
      setProjectForm({
        name: "",
        karma: "",
        targetSubreddits: [""]
      });
      setShowProjectModal(false);

      // Refresh projects list - ensure we see the new project
      setTimeout(() => {
        fetchProjects();
      }, 500);

    } catch (error: any) {
      console.error('Project creation error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create project",
        variant: "destructive"
      });
    } finally {
      setCreatingProject(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b-4 border-foreground bg-background px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/profile')}>Profile</Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={signOut}
            >
              Log out
            </Button>
            <Button variant="brutal" size="sm" className="font-semibold" onClick={() => setShowProjectModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create New Project
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Overview removed per user request */}

        {/* Projects Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Card 
                key={project.id} 
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/timeline/${project.id}`)}
              >
                <CardHeader>
                  <CardTitle className="text-lg">{project.name}</CardTitle>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span className="flex items-center space-x-1">
                      <TrendingUp className="w-4 h-4" />
                      <span>Level {project.karma_level} karma</span>
                    </span>
                    <Badge 
                      variant={
                        project.status === 'ready' || project.status === 'active' ? 'default' :
                        project.status === 'analyzing' ? 'secondary' : 'destructive'
                      }
                    >
                      {project.status}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Target Subreddits */}
                  <div>
                    <p className="text-sm font-medium mb-2">Target Subreddits:</p>
                    <div className="flex flex-wrap gap-1">
                      {project.target_subreddits.map((sub) => (
                        <Link 
                          key={sub} 
                          to={`/analytics/${sub}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Badge variant="secondary" className="text-xs hover:bg-secondary/80 cursor-pointer transition-colors">
                            r/{sub}
                          </Badge>
                        </Link>
                      ))}
                    </div>
                  </div>
                  
                  {/* Timeline progress removed from dashboard per request */}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State for New Users */}
        {projects.length === 0 && (
          <div className="text-center py-12">
            <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
            <p className="text-muted-foreground mb-6">Create your first Reddit marketing project to get started</p>
            <Button variant="brutal" onClick={() => setShowProjectModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create New Project
            </Button>
          </div>
        )}
      </main>

      {/* Project Setup Modal */}
      <Dialog open={showProjectModal} onOpenChange={setShowProjectModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Project Setup</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Project Name */}
            <div className="space-y-2">
              <Label htmlFor="project-name">Project Name</Label>
              <Input
                id="project-name"
                placeholder="e.g. Product Launch"
                value={projectForm.name}
                onChange={(e) => setProjectForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            {/* Reddit Karma */}
            <div className="space-y-2">
              <Label htmlFor="reddit-karma">Current Reddit Karma</Label>
              <Input
                id="reddit-karma"
                type="number"
                placeholder="e.g. 1500"
                value={projectForm.karma}
                onChange={(e) => setProjectForm(prev => ({ ...prev, karma: e.target.value }))}
              />
            </div>

            {/* Target Subreddits */}
            <div className="space-y-2">
              <Label>Target Subreddits</Label>
              <div className="space-y-2">
                {projectForm.targetSubreddits.map((subreddit, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input
                      placeholder="e.g. r/SaaS or just SaaS"
                      value={subreddit}
                      onChange={(e) => handleSubredditChange(index, e.target.value)}
                      onBlur={(e) => handleSubredditChange(index, normalizeSubreddit(e.target.value))}
                    />
                    {projectForm.targetSubreddits.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveSubreddit(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddSubreddit}
                    className="w-full"
                    disabled={projectForm.targetSubreddits.length >= 5}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Another Subreddit
                  </Button>
                  {projectForm.targetSubreddits.length >= 5 ? (
                    <p className="text-xs text-muted-foreground">Maximum of 5 subreddits reached</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">{5 - projectForm.targetSubreddits.length} slots remaining</p>
                  )}
                </div>
              </div>
            </div>

            {/* Generate Plan Button */}
            <div className="flex justify-end pt-4">
              <Button
                variant="brutal"
                size="lg"
                onClick={handleGeneratePlan}
                disabled={creatingProject}
                className="text-lg px-8"
              >
                {creatingProject ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Project...
                  </>
                ) : (
                  "Generate My Plan"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Compact Pricing Modal (non-scrolling) */}
      <Dialog open={showPricingModal} onOpenChange={(open) => setShowPricingModal(open)}>
        <DialogContent className="max-w-md w-full">
          <div className="relative p-6">

            <div className="text-center">
              <h3 className="text-2xl font-bold mb-1">One Time Payment</h3>
              <p className="text-sm text-muted-foreground mb-4">Get lifetime access to RedditPilot with guided playbooks & analytics.</p>

              <div className="mb-4">
                <div className="text-sm text-muted-foreground mb-1">Special Price</div>
                <div className="flex items-baseline justify-center space-x-3">
                  <span className="text-sm text-muted-foreground line-through">$29</span>
                  <span className="text-3xl font-black text-foreground">$23.20</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">One-time payment, lifetime access</p>
              </div>

              <div className="mb-2">
                <Button
                  className="w-full mb-0 h-12 text-lg font-bold bg-orange-500 hover:bg-orange-600 border-4 border-foreground shadow-brutal"
                  onClick={() => {
                    const redirectUrl = `${window.location.origin}/payment`;
                    const link = buildDodoPaymentLink({
                      redirectUrl,
                      userEmail: user?.email || null,
                      userId: user?.id || null,
                    });
                    window.open(link, '_blank', 'noopener,noreferrer');
                  }}
                >
                  Select Plan
                </Button>
              </div>
              <div className="text-center mt-2">
                <div className="text-sm font-medium">Use code <span className="font-bold">PRIVATE20</span> at checkout for 20% off</div>
              </div>

              <ul className="text-sm space-y-1 text-left max-w-sm mx-auto">
                <li>• Centralised Dashboard</li>
                <li>• Subreddit analytics</li>
                <li>• Personalized posting timeline</li>
                <li>• Unlimited Projects</li>
              </ul>

              <p className="text-xs text-muted-foreground mt-4">No subscription — lifetime access.</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Users, TrendingUp, Clock, ExternalLink, ThumbsUp, MessageCircle, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";

// Types for real analytics data
interface SubredditAnalytics {
  id: string;
  subreddit: string;
  subscriber_count: number;
  active_users: number;
  activity_heatmap: number[][];
  best_posting_day: number;
  best_posting_hour: number;
  top_posts: any[];
  avg_engagement_score: number;
  last_updated: string;
  created_at: string;
}

const SubredditAnalytics = () => {
  const { subreddit } = useParams<{ subreddit: string }>();
  const [data, setData] = useState<SubredditAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      if (!subreddit) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Clean subreddit name (remove r/ prefix if present)
        const cleanSubreddit = subreddit.replace(/^r\//, '');

        // Fetch analytics data from Supabase
        const { data: analyticsData, error: supabaseError } = await supabase
          .from('subreddit_analytics')
          .select('*')
          .eq('subreddit', cleanSubreddit)
          .single();

        if (supabaseError) {
          if (supabaseError.code === 'PGRST116') {
            setError(`No analytics data found for r/${cleanSubreddit}. This subreddit hasn't been analyzed yet.`);
          } else {
            console.error('Supabase error:', supabaseError);
            setError('Failed to fetch analytics data');
          }
          setLoading(false);
          return;
        }

        // Parse JSONB fields
        const parsedData: SubredditAnalytics = {
          ...analyticsData,
          activity_heatmap: typeof analyticsData.activity_heatmap === 'string' 
            ? JSON.parse(analyticsData.activity_heatmap) 
            : analyticsData.activity_heatmap,
          top_posts: typeof analyticsData.top_posts === 'string'
            ? JSON.parse(analyticsData.top_posts)
            : analyticsData.top_posts
        };

        setData(parsedData);

      } catch (error: any) {
        console.error('Error fetching analytics:', error);
        setError('Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [subreddit]);

  // Helper function to get day name from index
  const getDayName = (dayIndex: number): string => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayIndex] || 'Unknown';
  };

  // Helper function to get heatmap intensity for visualization
  const getHeatmapIntensity = (day: number, hour: number): number => {
    if (!data?.activity_heatmap || !data.activity_heatmap[day]) return 0;
    const value = data.activity_heatmap[day][hour] || 0;
    // Normalize the value to 0-1 range for visualization
    const maxValue = Math.max(...data.activity_heatmap.flat());
    return maxValue > 0 ? value / maxValue : 0;
  };

  const getHeatmapColor = (intensity: number): string => {
    if (intensity > 0.7) return "bg-green-600";
    if (intensity > 0.5) return "bg-green-500";
    if (intensity > 0.3) return "bg-green-400";
    if (intensity > 0.1) return "bg-green-300";
    return "bg-gray-200";
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <h2 className="text-lg font-semibold">Loading Analytics...</h2>
              <p className="text-muted-foreground">Fetching data for r/{subreddit}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <Link to="/dashboard">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
          
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Analytics Not Available</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {error || `No analytics data found for r/${subreddit}`}
            </p>
            <MissingAnalyticsCTA subreddit={subreddit || ''} />
          </div>
        </div>
      </div>
    );
  }

  // Constants for rendering
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const hours = Array.from({ length: 24 }, (_, i) => i);

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
            <h1 className="text-2xl font-bold text-foreground">r/{data.subreddit} Analytics</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <Badge variant="secondary">{data.subscriber_count.toLocaleString()} members</Badge>
            <Badge variant="outline">Updated {new Date(data.last_updated).toLocaleDateString()}</Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.subscriber_count.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {data.active_users > 0 && (
                  <span className="text-green-600">{data.active_users} active now</span>
                )}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Engagement</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.avg_engagement_score}</div>
              <p className="text-xs text-muted-foreground">Per post average</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Best Day</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getDayName(data.best_posting_day)}</div>
              <p className="text-xs text-muted-foreground">Optimal posting day</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Best Hour</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.best_posting_hour}:00</div>
              <p className="text-xs text-muted-foreground">Optimal posting time</p>
            </CardContent>
          </Card>
        </div>

        {/* Activity Heatmap */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Best Times to Post</CardTitle>
            <p className="text-sm text-muted-foreground">
              Activity heatmap showing optimal posting times. Darker colors indicate higher engagement.
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {/* Hour labels */}
              <div className="flex">
                <div className="w-20"></div>
                {hours.map(hour => (
                  <div key={hour} className="w-4 h-4 text-xs text-center text-muted-foreground mr-1">
                    {hour % 6 === 0 ? hour : ''}
                  </div>
                ))}
              </div>
              
              {/* Heatmap grid */}
              {days.map((day, dayIndex) => (
                <div key={day} className="flex items-center">
                  <div className="w-20 text-xs text-muted-foreground pr-2">{day}</div>
                  {hours.map(hour => {
                    const intensity = getHeatmapIntensity(dayIndex, hour);
                    return (
                      <div
                        key={hour}
                        className={`w-4 h-4 rounded-sm mr-1 ${getHeatmapColor(intensity)}`}
                        title={`${day} ${hour}:00 - Activity: ${Math.round(intensity * 100)}%`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Posts */}
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Posts This Month</CardTitle>
            <p className="text-sm text-muted-foreground">
              Highest performing posts by score and engagement
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.top_posts?.length > 0 ? (
                data.top_posts.map((post: any, index: number) => (
                  <div key={index} className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-sm leading-tight pr-4">{post.title}</h3>
                      <a 
                        href={post.permalink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground flex-shrink-0"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>by u/{post.author}</span>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <ThumbsUp className="w-3 h-3" />
                          <span>{post.score?.toLocaleString() || 0}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MessageCircle className="w-3 h-3" />
                          <span>{post.num_comments?.toLocaleString() || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No top posts data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Metrics Legend (non-intrusive, bottom of page) */}
        <div className="mt-8">
          <Card className="bg-muted/5">
            <CardHeader>
              <CardTitle>Metrics Legend</CardTitle>
              <p className="text-sm text-muted-foreground">Assumed measurement window: last 30 days (unless otherwise noted)</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div>
                  <strong>Members</strong>: Total number of subscribers to the subreddit (members). This is a point-in-time value reported by Reddit.
                </div>
                <div>
                  <strong>Avg. Engagement</strong>: Average engagement score per post (sum of weighted interactions / posts). Aggregated over the last 30 days.
                </div>
                <div>
                  <strong>Best Day / Best Hour</strong>: The weekday and hour with the highest activity over the last 30 days (local time is used for display).
                </div>
                <div>
                  <strong>Activity Heatmap</strong>: A 7x24 grid showing relative activity per day/hour across the last 30 days. Darker cells indicate higher relative activity.
                </div>
                <div>
                  <strong>Top Posts</strong>: Best performing posts (by score and engagement) in the last 30 days. Each post shows score, author, and number of comments.
                </div>
                <div>
                  <strong>Notes</strong>: Values are best-effort estimates from Reddit's public data and our analytic heuristics. Small subreddits may show sparse data; very large values are clamped for display and database storage.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default SubredditAnalytics;

// --- Helper component to fetch analytics on-demand ---
import { useAuth } from "@/contexts/AuthContext";

function MissingAnalyticsCTA({ subreddit }: { subreddit: string }) {
  const { session } = useAuth();
  const [busy, setBusy] = useState(false);

  const handleFetchNow = async () => {
    if (!subreddit) return;
    setBusy(true);
    try {
      const clean = subreddit.replace(/^r\//, '');
      const resp = await fetch('/api/reddit/subreddit-analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ subreddits: [clean] }),
      });
      if (!resp.ok) throw new Error(`Fetch failed: ${resp.status}`);
      const json = await resp.json();
      const ok = (json?.analytics || []).find((e: any) => e.subreddit === clean && e.success);
      if (!ok) throw new Error('No analytics returned');

      const payload = ok.data;
      // Upsert to Supabase from frontend per rules
      const insert = {
        subreddit: clean,
        subscriber_count: Number(payload.subscriber_count ?? payload.subscribers ?? 0) || 0,
        active_users: Number(payload.active_users ?? 0) || 0,
        activity_heatmap: payload.activity_heatmap ?? null,
        best_posting_day: typeof payload.best_posting_day === 'number' ? payload.best_posting_day : null,
        best_posting_hour: typeof payload.best_posting_hour === 'number' ? payload.best_posting_hour : null,
        top_posts: payload.top_posts ?? null,
        avg_engagement_score: Number(payload.avg_engagement_score ?? 0) || 0,
        last_updated: new Date().toISOString(),
      } as any;

      const { error } = await supabase
        .from('subreddit_analytics')
        .upsert(insert, { onConflict: 'subreddit' });
      if (error) throw error;

      toast({ title: 'Analytics ready', description: `Fetched analytics for r/${clean}` });
      // Reload page data
      window.location.reload();
    } catch (e: any) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Failed to fetch analytics', description: e?.message || 'Try again later' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        You can fetch analytics for r/{subreddit.replace(/^r\//, '')} now. This may take a few seconds.
      </p>
      <div className="flex items-center justify-center gap-3">
        <Button onClick={handleFetchNow} disabled={busy}>
          {busy ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Fetching…</>) : 'Fetch Now'}
        </Button>
        <Link to="/dashboard">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
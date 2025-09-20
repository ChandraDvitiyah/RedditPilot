import { useAuth } from '../contexts/AuthContext';

const API_BASE_URL = import.meta.env.DEV 
  ? 'http://localhost:3001/api' 
  : '/api';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

class ApiClient {
  private baseUrl: string;
  private getAuthToken: () => string | null;

  constructor(baseUrl: string, getAuthToken: () => string | null) {
    this.baseUrl = baseUrl;
    this.getAuthToken = getAuthToken;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = this.getAuthToken();
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, config);
      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP ${response.status}`,
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, body: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async patch<T>(endpoint: string, body: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Types for API responses
export interface Project {
  id: string;
  name: string;
  description?: string;
  karma_level: number;
  target_subreddits: string[];
  status: 'analyzing' | 'ready' | 'active' | 'completed' | 'error';
  timezone: string;
  created_at: string;
  updated_at: string;
  progress?: {
    totalTasks: number;
    completedTasks: number;
    percentage: number;
  };
}

export interface TimelineItem {
  id: string;
  type: 'post' | 'comment' | 'engagement' | 'milestone';
  title: string;
  description: string;
  subreddit?: string;
  scheduledDate: string;
  template: string;
  status: 'pending' | 'completed' | 'skipped';
  metadata?: {
    postType?: 'launch' | 'ama' | 'milestone' | 'update' | 'showcase';
    engagementGoal?: number;
    templateContent?: string;
  };
}

export interface Timeline {
  projectId: string;
  items: TimelineItem[];
  totalDuration: number;
  postsCount: number;
  engagementTasksCount: number;
}

export interface SubredditAnalytics {
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
  last_updated: string;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  karma: number;
  targetSubreddits: string[];
  timezone?: string;
}

// Hook for using the API client
export function useApiClient() {
  const { session } = useAuth();
  
  const getAuthToken = () => {
    return session?.access_token || null;
  };

  const client = new ApiClient(API_BASE_URL, getAuthToken);

  return {
    // Projects
    createProject: (data: CreateProjectRequest) => 
      client.post<{ message: string; project: Project }>('/projects', data),
    
    getProjects: () => 
      client.get<{ projects: Project[] }>('/projects'),
    
    // Timeline
    getTimeline: (projectId: string) => 
      client.get<{ project: { id: string; name: string; status: string }; timeline: Timeline; generated_at: string }>(`/timeline?projectId=${encodeURIComponent(projectId)}`),
    
    updateTimelineItem: (projectId: string, itemId: string, status: 'pending' | 'completed' | 'skipped') =>
      client.patch<{ message: string; item: TimelineItem }>(`/timeline?projectId=${encodeURIComponent(projectId)}`, { itemId, status }),
    
    // Analytics (public endpoint)
    getSubredditAnalytics: (subreddit: string) =>
      client.get<SubredditAnalytics>(`/analytics?subreddit=${encodeURIComponent(subreddit.replace(/^r\//, ''))}`),
    
    // Health check
    healthCheck: () =>
      client.get<{ status: string; timestamp: string }>('/health'),
  };
}

export type { ApiResponse };
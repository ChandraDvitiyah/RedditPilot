# RedditPilot Backend API

Complete backend implementation for RedditPilot using Vercel serverless functions and Supabase.

## 🗄️ Database Setup

### 1. Run Supabase Migration

Execute the SQL migration in your Supabase SQL editor:

```sql
-- File: supabase/migrations/001_initial_schema.sql
-- Copy the content from the migration file and run in Supabase dashboard
```

This creates:
- `projects` table with RLS policies
- `subreddit_analytics` table for cached Reddit data
- `project_timelines` table with RLS policies
- Proper indexes and triggers

### 2. Environment Variables

Add these to your Vercel environment variables:

```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_URL=your_supabase_url (fallback)
SUPABASE_ANON_KEY=your_supabase_anon_key (fallback)
```

## 🚀 API Endpoints

### Authentication

All endpoints (except analytics) require Bearer token in Authorization header:
```
Authorization: Bearer <supabase_jwt_token>
```

### 1. Create Project
**POST** `/api/projects`

Creates a new project and triggers background analytics processing.

**Request Body:**
```json
{
  "name": "My Project",
  "description": "Optional description",
  "karma": 3,
  "targetSubreddits": ["programming", "webdev", "javascript"],
  "timezone": "America/New_York"
}
```

**Response:**
```json
{
  "message": "Project created successfully",
  "project": {
    "id": "uuid",
    "name": "My Project",
    "description": "Optional description",
    "karma_level": 3,
    "target_subreddits": ["programming", "webdev", "javascript"],
    "timezone": "America/New_York",
    "status": "analyzing",
    "created_at": "2025-09-19T..."
  }
}
```

**Status Flow:**
- `analyzing` → Fetching Reddit analytics
- `ready` → Timeline generated, ready to use
- `active` → User has started working on timeline
- `error` → Failed to process

### 2. Get Projects List
**GET** `/api/projects-list`

Returns all user's projects with progress information.

**Response:**
```json
{
  "projects": [
    {
      "id": "uuid",
      "name": "My Project",
      "status": "ready",
      "target_subreddits": ["programming"],
      "created_at": "...",
      "progress": {
        "totalTasks": 45,
        "completedTasks": 12,
        "percentage": 27
      }
    }
  ]
}
```

### 3. Get Project Timeline
**GET** `/api/timeline?projectId=uuid`

Returns the generated timeline for a specific project.

**Response:**
```json
{
  "project": {
    "id": "uuid",
    "name": "My Project",
    "status": "ready"
  },
  "timeline": {
    "projectId": "uuid",
    "items": [
      {
        "id": "abc123",
        "type": "post",
        "title": "🚀 Introducing My Project",
        "description": "Share your project launch with the community",
        "subreddit": "programming",
        "scheduledDate": "2025-09-20T14:00:00.000Z",
        "template": "launch",
        "status": "pending",
        "metadata": {
          "postType": "launch",
          "templateContent": "Hey r/programming! I'm excited to introduce My Project..."
        }
      }
    ],
    "totalDuration": 90,
    "postsCount": 15,
    "engagementTasksCount": 30
  },
  "generated_at": "2025-09-19T..."
}
```

### 4. Update Timeline Item
**PATCH** `/api/timeline-update?projectId=uuid`

Mark timeline items as completed/skipped.

**Request Body:**
```json
{
  "itemId": "abc123",
  "status": "completed"
}
```

**Response:**
```json
{
  "message": "Timeline updated successfully",
  "item": {
    "id": "abc123",
    "status": "completed",
    // ... other item fields
  }
}
```

### 5. Get Subreddit Analytics
**GET** `/api/analytics?subreddit=programming`

Returns cached analytics for any subreddit (public endpoint).

**Response:**
```json
{
  "subreddit": "programming",
  "subscriber_count": 4500000,
  "active_users": 12000,
  "activity_heatmap": [[0,0,0...], [0,0,0...], ...], // 7x24 matrix
  "best_posting_day": 2, // 0=Sunday, 6=Saturday
  "best_posting_hour": 14, // 0-23 UTC
  "top_posts": [
    {
      "title": "Popular post title",
      "score": 1500,
      "comments": 234,
      "url": "https://reddit.com/...",
      "author": "username"
    }
  ],
  "avg_engagement_score": 145.67,
  "last_updated": "2025-09-19T..."
}
```

## 🔄 Background Processing Flow

1. **Project Creation** → Returns immediately with `analyzing` status
2. **Analytics Fetching** → Parallel requests to Reddit API for each subreddit
3. **Caching** → Analytics saved to Supabase (30-day cache)
4. **Timeline Generation** → Intelligent scheduling based on:
   - User's karma level (low karma = more engagement tasks)
   - Optimal posting times from analytics
   - Max 2 posts per day across all subreddits
   - 90-day timeline with engagement tasks
5. **Status Update** → Project marked as `ready`

## 🛡️ Security Features

### Row Level Security (RLS)
- Projects: Users can only access their own projects
- Timelines: Users can only access their own timelines
- Analytics: Public (shared across users for efficiency)

### Rate Limiting
- Project creation: 5 requests per minute per user
- In-memory store (use Redis in production)

### Input Validation
- Subreddit names validated with regex
- Karma level 1-5 validation
- Max 5 target subreddits per project
- Request body sanitization

### Reddit API Protection
- 2-second rate limiting between requests
- User-Agent headers
- Error handling and retries
- Graceful degradation

## 🎯 Timeline Generation Logic

### Karma-Based Strategy
- **Low Karma (1-2)**: More engagement tasks, fewer posts initially
- **High Karma (3-5)**: Balanced posting and engagement schedule

### Post Templates
- **Launch**: Initial project introduction
- **AMA**: Ask Me Anything sessions  
- **Milestone**: Progress updates and achievements
- **Update**: Regular progress reports
- **Showcase**: Feature highlights

### Optimal Timing
- Analyzes activity heatmaps from Reddit data
- Calculates weighted average of best posting times
- Schedules posts during peak engagement hours
- Fills non-posting days with engagement tasks

## 📊 Analytics Collection

### Reddit API Data Points
- Subreddit subscriber count and active users
- Top, hot, and new posts analysis
- 7x24 activity heatmap generation
- Best posting day/hour calculation
- Average engagement scores
- Top 5 posts of the month

### Caching Strategy
- 30-day cache per subreddit
- Automatic refresh for stale data
- Shared analytics across all users
- Background processing to avoid timeouts

## 🚨 Error Handling

### API Responses
- Structured error messages
- Appropriate HTTP status codes
- Development vs production error details
- Reddit API unavailability handling

### Background Processing
- Graceful failure handling
- Project status updates on errors
- Partial success for multiple subreddits
- Retry mechanisms for transient failures

## 📈 Performance Optimizations

### Database
- Proper indexing on user_id, project_id, subreddit
- JSONB for flexible timeline storage
- Efficient RLS policies

### Reddit API
- Intelligent caching strategy
- Rate limiting to avoid blocks
- Parallel processing where possible
- Error recovery and fallbacks

### Vercel Functions
- Optimized bundle sizes
- Background processing for long operations
- CORS handling for frontend integration

This backend provides a robust, scalable foundation for RedditPilot with proper security, caching, and intelligent timeline generation!
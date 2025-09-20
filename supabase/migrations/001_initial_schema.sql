-- Enable RLS
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA PUBLIC GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    karma_level INTEGER NOT NULL CHECK (karma_level IN (1, 2, 3, 4, 5)), -- 1=low, 5=high
    target_subreddits TEXT[] NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'analyzing', 'ready', 'active', 'completed', 'error')),
    timezone VARCHAR(100) DEFAULT 'UTC',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create subreddit_analytics table
CREATE TABLE IF NOT EXISTS subreddit_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    subreddit VARCHAR(255) NOT NULL UNIQUE,
    subscriber_count INTEGER,
    active_users INTEGER,
    activity_heatmap JSONB, -- 7x24 array of activity scores
    best_posting_day INTEGER, -- 0=Sunday, 6=Saturday
    best_posting_hour INTEGER, -- 0-23 UTC
    top_posts JSONB, -- Array of top 5 posts with title, score, comments, url
    avg_engagement_score DECIMAL(5,2),
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create project_timelines table
CREATE TABLE IF NOT EXISTS project_timelines (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    timeline_data JSONB NOT NULL, -- Array of timeline items with dates, types, content
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_subreddit_analytics_subreddit ON subreddit_analytics(subreddit);
CREATE INDEX idx_subreddit_analytics_last_updated ON subreddit_analytics(last_updated);
CREATE INDEX idx_project_timelines_project_id ON project_timelines(project_id);
CREATE INDEX idx_project_timelines_user_id ON project_timelines(user_id);

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_timelines ENABLE ROW LEVEL SECURITY;

-- Note: subreddit_analytics is shared across users, so no RLS needed

-- RLS Policies for projects table
CREATE POLICY "Users can only access their own projects"
    ON projects FOR ALL
    USING (auth.uid() = user_id);

-- RLS Policies for project_timelines table  
CREATE POLICY "Users can only access their own project timelines"
    ON project_timelines FOR ALL
    USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_projects_updated_at 
    BEFORE UPDATE ON projects 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Backend now handles only external APIs (Reddit, etc.)
// All Supabase operations moved to frontend

// Types
interface AuthenticatedRequest extends express.Request {
  user?: {
    id: string;
    email: string;
  };
}

// Simple auth middleware for external API routes
// Frontend handles Supabase auth, this is just for API protection
async function validateAuth(req: express.Request): Promise<{ user: { id: string; email: string } } | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  
  try {
    // For external API routes, we'll validate tokens differently
    // or rely on frontend to pass user info
    // For now, mock validation - in real app, validate JWT token
    if (token && token.length > 10) {
      return {
        user: {
          id: 'user_' + token.slice(-8), // Mock user ID from token
          email: 'user@example.com'
        }
      };
    }
    return null;
  } catch (error) {
    console.error('Auth validation error:', error);
    return null;
  }
}

function withAuth(handler: (req: AuthenticatedRequest, res: express.Response) => Promise<any>) {
  return async (req: express.Request, res: express.Response) => {
    const auth = await validateAuth(req);
    
    if (!auth) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    (req as AuthenticatedRequest).user = auth.user;
    return handler(req as AuthenticatedRequest, res);
  };
}

// Validation functions - simplified since frontend handles Supabase validation
interface CreateProjectRequest {
  name: string;
  description?: string;
  karma: number;
  targetSubreddits: string[];
  timezone?: string;
}

// This validation is now mainly for external API endpoints
function validateSubredditAnalyticsRequest(body: any): { subreddits: string[] } | null {
  if (!body || typeof body !== 'object') {
    return null;
  }

  const { subreddits } = body;

  if (!subreddits || !Array.isArray(subreddits) || subreddits.length === 0 || subreddits.length > 5) {
    return null;
  }

  // Validate subreddit names
  const validSubreddits = subreddits.every(sub => 
    typeof sub === 'string' && 
    sub.trim().length > 0 && 
    /^[a-zA-Z0-9_]{1,21}$/.test(sub.replace(/^r\//, ''))
  );

  if (!validSubreddits) {
    return null;
  }

  // Normalize subreddit names
  const normalizedSubreddits = subreddits.map(sub => 
    sub.replace(/^r\//, '').toLowerCase().trim()
  );

  // Remove duplicates
  const uniqueSubreddits = [...new Set(normalizedSubreddits)];

  return {
    subreddits: uniqueSubreddits
  };
}

function handleError(res: express.Response, error: any, defaultMessage = 'Internal server error') {
  console.error('API Error:', error);
  
  if (error.message && error.message.includes('Reddit API error')) {
    return res.status(503).json({ error: 'Reddit API temporarily unavailable' });
  }
  
  return res.status(500).json({ 
    error: process.env.NODE_ENV === 'development' ? error.message : defaultMessage 
  });
}

// Rate limiting store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function rateLimit(identifier: string, maxRequests = 10, windowMs = 60000): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (record.count >= maxRequests) {
    return false;
  }
  
  record.count++;
  return true;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Import and setup route handlers
import { setupProjectsRoutes } from './routes/projects';
import { setupTimelineRoutes } from './routes/timeline';
import { setupAnalyticsRoutes } from './routes/analytics';

// Setup routes
setupProjectsRoutes(app);
setupTimelineRoutes(app);
setupAnalyticsRoutes(app);

// Export for use in route files
export { app, withAuth, validateSubredditAnalyticsRequest, handleError, rateLimit, AuthenticatedRequest };

// Start server
app.listen(PORT, () => {
  console.log(`🚀 RedditPilot API server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});
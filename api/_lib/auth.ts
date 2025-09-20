import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export interface AuthenticatedRequest extends VercelRequest {
  user?: {
    id: string;
    email: string;
  };
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export async function validateAuth(req: VercelRequest): Promise<{ user: { id: string; email: string } } | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return null;
    }

    return {
      user: {
        id: user.id,
        email: user.email || ''
      }
    };
  } catch (error) {
    console.error('Auth validation error:', error);
    return null;
  }
}

export function withAuth(handler: (req: AuthenticatedRequest, res: VercelResponse) => Promise<void | VercelResponse>) {
  return async (req: VercelRequest, res: VercelResponse) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    const auth = await validateAuth(req);
    
    if (!auth) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    (req as AuthenticatedRequest).user = auth.user;
    return handler(req as AuthenticatedRequest, res);
  };
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  karma: number;
  targetSubreddits: string[];
  timezone?: string;
}

export function validateCreateProjectRequest(body: any): CreateProjectRequest | null {
  if (!body || typeof body !== 'object') {
    return null;
  }

  const { name, description, karma, targetSubreddits, timezone } = body;

  // Validate required fields
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return null;
  }

  if (!karma || typeof karma !== 'number' || karma < 1 || karma > 5) {
    return null;
  }

  if (!targetSubreddits || !Array.isArray(targetSubreddits) || targetSubreddits.length === 0 || targetSubreddits.length > 5) {
    return null;
  }

  // Validate subreddit names
  const validSubreddits = targetSubreddits.every(sub => 
    typeof sub === 'string' && 
    sub.trim().length > 0 && 
    /^[a-zA-Z0-9_]{1,21}$/.test(sub.replace(/^r\//, ''))
  );

  if (!validSubreddits) {
    return null;
  }

  // Normalize subreddit names
  const normalizedSubreddits = targetSubreddits.map(sub => 
    sub.replace(/^r\//, '').toLowerCase().trim()
  );

  // Remove duplicates
  const uniqueSubreddits = [...new Set(normalizedSubreddits)];

  return {
    name: name.trim(),
    description: description && typeof description === 'string' ? description.trim() : undefined,
    karma,
    targetSubreddits: uniqueSubreddits,
    timezone: timezone && typeof timezone === 'string' ? timezone : 'UTC'
  };
}

export function handleError(res: VercelResponse, error: any, defaultMessage = 'Internal server error') {
  console.error('API Error:', error);
  
  if (error.message && error.message.includes('Reddit API error')) {
    return res.status(503).json({ error: 'Reddit API temporarily unavailable' });
  }
  
  return res.status(500).json({ 
    error: process.env.NODE_ENV === 'development' ? error.message : defaultMessage 
  });
}

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(identifier: string, maxRequests = 10, windowMs = 60000): boolean {
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

export { supabase };
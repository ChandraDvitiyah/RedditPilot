import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [displayName, setDisplayName] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      try {
        const { data } = await supabase
          .from('user_account')
          .select('name')
          .eq('user_id', user.id)
          .single();
        if (data && data.name) {
          setDisplayName(data.name);
          return;
        }
      } catch (e) {
        // ignore
      }

      // fallback to metadata full_name or local part of email
      const metaName = (user as any)?.user_metadata?.full_name || null;
      if (metaName) {
        setDisplayName(metaName);
        return;
      }
      if (user?.email) setDisplayName(user.email.split('@')[0]);
    };
    load();
  }, [user]);

  const handleRefreshPayment = async () => {
    if (!user) {
      toast({ title: 'Not logged in', description: 'Please login to refresh payment status' });
      return;
    }
    setLoading(true);
    const cacheKey = `rp_payment_status_${user.id}`;
    try {
      // Delete existing cache
      try { localStorage.removeItem(cacheKey); } catch {}

      // Fetch latest from Supabase
      const { data, error } = await supabase
        .from('user_account')
        .select('payment_status')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      const statusVal = data?.payment_status ?? null;
      const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
      localStorage.setItem(cacheKey, JSON.stringify({ status: statusVal, expiresAt }));

      toast({ title: 'Payment status refreshed', description: `Status: ${statusVal}` });
    } catch (e: any) {
      console.error('Failed to refresh payment status', e);
      toast({ title: 'Error', description: e?.message || 'Failed to refresh payment status', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const bgUrl = "https://ik.imagekit.io/samudrua/RedditPilot/profile-bg?updatedAt=1758386005321";

  return (
    <div className="min-h-screen p-6 flex items-center justify-center" style={{ backgroundImage: `url('${bgUrl}')`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="w-full max-w-3xl relative z-10">
        <div className="bg-background/40 border-4 border-foreground shadow-brutal rounded-md">
          <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-black">Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">Display Name</div>
                <div className="font-medium">{displayName || '—'}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Email</div>
                <div className="font-medium">{user?.email || '—'}</div>
              </div>

              <div className="flex gap-3">
                <Button asChild>
                  <a href="mailto:contact@redditpilot.com">Contact Support</a>
                </Button>
                <Button onClick={handleRefreshPayment} disabled={loading}>
                  {loading ? 'Refreshing...' : 'Refresh Payment Status'}
                </Button>
                <Button variant="outline" onClick={() => navigate('/dashboard')}>Back</Button>
              </div>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;

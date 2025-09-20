import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";

type Status = "processing" | "success" | "failed";

const Payment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [status, setStatus] = useState<Status>("processing");
  const [message, setMessage] = useState<string>("Confirming your payment…");

  useEffect(() => {
    const process = async () => {
      // Parse query params from Dodo redirect
      const params = new URLSearchParams(location.search);
      const dodoStatus = (params.get("status") || "").toLowerCase();
      const paymentId = params.get("payment_id") || null;

  // Only succeed when status is exactly 'succeeded'
  const isSuccess = dodoStatus === "succeeded";

      // If not logged in, we cannot update the DB; send to login
      if (!user) {
        setStatus(isSuccess ? "success" : "failed");
        setMessage("Please log in to complete your payment confirmation.");
        toast({ title: "Login required", description: "Log in and we'll finish confirming your payment." });
        navigate("/login");
        return;
      }

      try {
        // Map to your CHECK constraint allowed set
        // success -> 'active', anything else -> 'cancelled'
        const targetStatus = isSuccess ? 'active' : 'cancelled';

        // Try UPDATE, then INSERT if no row exists
        let wrote = false;
        try {
          const { data: updData, error: updErr } = await supabase
            .from('user_account')
            .update({ payment_status: targetStatus })
            .eq('user_id', user.id)
            .select('user_id');
          if (!updErr && updData && updData.length > 0) wrote = true;
        } catch {}

        if (!wrote) {
          const { error: insErr } = await supabase
            .from('user_account')
            .insert({ user_id: user.id, payment_status: targetStatus });
          if (insErr) throw insErr;
        }

        // Cache status for 30 days. If success, remove any existing cache first and override.
        const cacheKey = `rp_payment_status_${user.id}`;
        try {
          if (isSuccess) {
            localStorage.removeItem(cacheKey);
          }
        } catch {}

        const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
        localStorage.setItem(cacheKey, JSON.stringify({ status: targetStatus, expiresAt }));

        if (isSuccess) {
          setStatus('success');
          setMessage("Payment confirmed. You're all set!");
          toast({ title: 'Payment confirmed', description: "You're good to go." });
          setTimeout(() => navigate('/dashboard'), 1500);
        } else {
          setStatus('failed');
          setMessage('Payment was not successful. Please try again.');
        }
      } catch (e: any) {
        setStatus("failed");
        setMessage("We couldn't update your payment status. Please try again.");
        console.error("Payment update error", e);
        toast({ title: "Payment update failed", description: e?.message || "Unknown error", variant: "destructive" });
      }
    };

    process();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search, user?.id]);

  const bgUrl = "https://ik.imagekit.io/samudrua/RedditPilot/payments-background?updatedAt=1758384812613";

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundImage: `url('${bgUrl}')`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
      {/* dark overlay */}
      <div className="absolute inset-0 bg-black/60 pointer-events-none" />
      <Card className="w-full max-w-md border-4 border-foreground shadow-brutal relative z-10">
        <CardHeader>
          <CardTitle className="text-xl font-black">Payment Status</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {status === "processing" && (
            <div className="flex flex-col items-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p className="text-sm text-muted-foreground">{message}</p>
            </div>
          )}
          {status === "success" && (
            <div className="flex flex-col items-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
              <p className="text-sm">{message}</p>
              <Button className="w-full" onClick={() => navigate("/dashboard")}>Go to Dashboard</Button>
            </div>
          )}
          {status === "failed" && (
            <div className="flex flex-col items-center space-y-3">
              <XCircle className="w-10 h-10 text-red-600" />
              <p className="text-sm">{message}</p>
              <div className="flex gap-2 w-full">
                <Button variant="outline" className="w-1/2" onClick={() => navigate("/dashboard")}>Home</Button>
                <Button className="w-1/2" onClick={() => navigate("/dashboard")}>Try Again</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Payment;

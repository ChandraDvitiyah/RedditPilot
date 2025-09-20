import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { buildDodoPaymentLink } from "@/lib/dodo";

// NOTE: Landing page Select Plan should NOT prefill discount (PRIVATE20). The modal uses the discount message.

const PricingSection = () => {
  return (
    <section className="py-20 bg-background border-t-4 border-b-4 border-foreground">
      <div className="max-w-7xl mx-auto px-6">
        {/* Top Badge */}
        <div className="text-center mb-8">
            <span className="inline-block px-6 py-2 bg-transparent border-2 border-muted-foreground rounded-full text-muted-foreground text-sm font-semibold">
              ONE-TIME PAYMENT ONLY
            </span>
        </div>

        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-6xl font-black text-foreground mb-4">
            Plans and pricing
          </h2>
          <p className="text-lg text-muted-foreground">
            A plan that's right for you.
          </p>
        </div>

        {/* Single Pricing Card */}
        <div className="max-w-md mx-auto">
          <div className="bg-card border-4 border-foreground rounded-2xl p-8 shadow-brutal relative">
            {/* Badge */}
            <div className="absolute -top-3 right-6">
              <span className="bg-foreground text-background px-4 py-1 rounded-full text-sm font-bold">
                POPULAR
              </span>
            </div>

            {/* Header */}
            <div className="mb-8">
              <h3 className="text-2xl font-black text-foreground mb-2">One Time Payment</h3>
              <p className="text-sm text-muted-foreground">
                Get lifetime access to RedditPilot with guided playbooks and analytics.
              </p>
            </div>

            {/* Price */}
            <div className="mb-8">
              <div className="flex items-baseline space-x-2">
                <span className="text-5xl font-black text-foreground">$49</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">One-time payment, lifetime access</p>
            </div>

            {/* CTA Button */}
            <SelectPlanButton />

            {/* Features */}
            <div>
              <p className="text-sm font-semibold text-foreground mb-4">Everything included:</p>
              <ul className="space-y-3">
                <li className="flex items-center space-x-3">
                  <div className="w-5 h-5 bg-foreground rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-background" />
                  </div>
                  <span className="text-sm text-foreground">Centralised Dashboard</span>
                </li>
                
                <li className="flex items-center space-x-3">
                  <div className="w-5 h-5 bg-foreground rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-background" />
                  </div>
                  <span className="text-sm text-foreground">Subreddit analytics</span>
                </li>
                
                <li className="flex items-center space-x-3">
                  <div className="w-5 h-5 bg-foreground rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-background" />
                  </div>
                  <span className="text-sm text-foreground">Ready-to-use post templates</span>
                </li>
                
                <li className="flex items-center space-x-3">
                  <div className="w-5 h-5 bg-foreground rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-background" />
                  </div>
                  <span className="text-sm text-foreground">Personalized posting timeline</span>
                </li>
                
                <li className="flex items-center space-x-3">
                  <div className="w-5 h-5 bg-foreground rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-background" />
                  </div>
                  <span className="text-sm text-foreground">Unlimited Projects</span>
                </li>
                
                <li className="flex items-center space-x-3">
                  <div className="w-5 h-5 bg-foreground rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-background" />
                  </div>
                  <span className="text-sm text-foreground">Lifetime updates & support</span>
                </li>
              </ul>
            </div>

            {/* Bottom Note */}
            <div className="mt-8 pt-6 border-t-2 border-muted">
              <p className="text-xs text-muted-foreground text-center">
                No Subscription, Access for lifetime.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;

function SelectPlanButton() {
  const { user, signInWithGoogle, session } = useAuth();

  const handleClick = async () => {
    // If user is not logged in, trigger OAuth sign-in and then redirect to payment
    if (!user) {
      // Persist intent so the login flow knows to redirect to checkout after auth
      try { localStorage.setItem('rp_pending_checkout', 'true'); } catch {}
      // Start OAuth flow; Login page will handle redirect after auth
      await signInWithGoogle();
      return;
    }

    const redirectUrl = `${window.location.origin}/payment`;
    const link = buildDodoPaymentLink({
      redirectUrl,
      userEmail: user?.email || null,
      userId: user?.id || null,
    });
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  return (
    <Button
      className="w-full mb-8 h-14 text-lg font-bold bg-orange-500 hover:bg-orange-600 border-4 border-foreground shadow-brutal"
      size="lg"
      onClick={handleClick}
    >
      Select Plan
    </Button>
  );
}
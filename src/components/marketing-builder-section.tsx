import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';

const MarketingBuilderSection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-20 bg-slate-900 border-t-4 border-b-0 border-foreground">
      <div className="max-w-7xl mx-auto px-6">
        {/* Top Badge */}
        <div className="text-center mb-12">
          <span className="inline-block px-6 py-2 bg-transparent border-2 border-muted-foreground rounded-full text-muted-foreground text-sm font-semibold">
            SET UP YOUR PROJECT
          </span>
        </div>

        {/* Main Heading */}
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-6xl font-black text-white mb-6">
            Your Strategy. Done For You.
          </h2>
          <p className="text-lg text-muted-foreground max-w-4xl mx-auto">
            Tell us about your project, target audience, and karma level. We'll build your custom Reddit growth strategy.
          </p>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left - Dashboard Card */}
          <div className="relative">
            {/* Single card with image filling it (no thick border) */}
            <div className="bg-card rounded-2xl overflow-hidden shadow-brutal">
              <img
                src="https://ik.imagekit.io/samudrua/RedditPilot/newproject?updatedAt=1758315937620"
                alt="strategy overview"
                className="w-full h-64 sm:h-72 md:h-80 object-cover block"
              />
            </div>
          </div>

          {/* Right - Content */}
          <div>
            <h3 className="text-4xl lg:text-5xl font-black text-white mb-6">
              Get Personalised<br />Plan
            </h3>
            <p className="text-lg text-muted-foreground mb-8">
              Fill out details regarding your project and target audience in form of subreddits and we will give u a personalised growth path.
            </p>
            <Button variant="secondary" size="lg" className="font-bold" onClick={() => navigate('/dashboard')}>
              Start Building
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MarketingBuilderSection;
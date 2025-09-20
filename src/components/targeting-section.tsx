import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { TrendingUp } from "lucide-react";

const TargetingSection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-20 bg-slate-900 border-t-4 border-b-0 border-foreground">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left - Content */}
          <div>
            <h3 className="text-4xl lg:text-5xl font-black text-white mb-6">
              Subreddit analytics<br />& insights
            </h3>
            <p className="text-lg text-muted-foreground mb-8">
              Track engagement, optimal posting times for each subreddit in your strategy. Never guess when or what to post again.
            </p>
            <Button variant="secondary" size="lg" className="font-bold" onClick={() => navigate('/dashboard')}>
              View Analytics
            </Button>
          </div>

          {/* Right - Image Analytics Card */}
          <div className="relative">
            <div className="bg-card rounded-2xl overflow-hidden shadow-brutal">
              <img
                src="https://ik.imagekit.io/samudrua/RedditPilot/subredditanalytics?updatedAt=1758315937525"
                alt="subreddit analytics"
                className="w-full h-64 sm:h-72 md:h-80 object-cover block"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TargetingSection;
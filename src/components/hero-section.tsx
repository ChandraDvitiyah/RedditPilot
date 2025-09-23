import { Button } from "@/components/ui/button";
import { Check, Play } from "lucide-react";
import FloatingCards from "@/components/ui/floating-cards";
import { useNavigate } from 'react-router-dom';

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="min-h-screen bg-gradient-subtle relative overflow-hidden border-4 border-foreground">
      <div className="max-w-7xl mx-auto px-6 py-16 grid lg:grid-cols-2 gap-12 items-center min-h-[calc(100vh-88px)]">
        {/* Left Content */}
        <div className="space-y-8 lg:pr-8">
          {/* Trust Badge */}
          <div className="inline-flex items-center space-x-2 bg-card border-4 border-foreground rounded-full px-4 py-2">
            <span className="text-sm font-medium text-foreground">No Subscription</span>
            <div className="w-5 h-5 bg-foreground rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-background transform rotate-45"></div>
            </div>
          </div>

          {/* Main Headline */}
          <div className="space-y-4">
            <h1 className="text-5xl lg:text-6xl xl:text-7xl font-black text-foreground leading-tight tracking-tight font-black">
              Reddit Growth <br /> Without getting Banned
            </h1>
          </div>

          {/* Subtitle */}
          <p className="text-lg lg:text-xl text-muted-foreground max-w-xl leading-relaxed">
            RedditPilot's guided playbook shows you exactly what to post, when to post, and how to stay compliant. No more guesswork.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <Button variant="orange" size="lg" className="text-lg px-8 py-4 h-auto" onClick={() => navigate('/dashboard')}>
              Get Instant Access
            </Button>
            
            <div className="flex items-center space-x-2">
              <span className="text-muted-foreground font-medium">OR</span>
            </div>
            
            <button
              onClick={() => {
                const el = document.getElementById('video-demo');
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className="flex items-center space-x-3 text-foreground font-medium hover:opacity-80 transition-opacity"
            >
              <div className="w-10 h-10 bg-foreground rounded-full flex items-center justify-center">
                <Play className="w-4 h-4 text-background fill-background ml-0.5" />
              </div>
              <span>Watch Demo</span>
            </button>
          </div>
        </div>

        {/* Right Visual Section */}
        <div className="relative lg:pl-8">
          {/* Background Image */}
          <div className="relative">
            <img
              src="https://ik.imagekit.io/samudrua/RedditPilot/herolanding?updatedAt=1758307494266"
              alt="Founder using RedditPilot dashboard"
              className="w-full h-[600px] object-cover border-4 border-foreground"
            />
            
            {/* Floating UI Cards */}
            <FloatingCards />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
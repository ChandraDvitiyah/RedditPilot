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
            <span className="text-sm font-medium text-foreground">Reddit Co-Pilot</span>
            <div className="w-5 h-5 bg-foreground rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-background transform rotate-45"></div>
            </div>
          </div>

          {/* Main Headline */}
          <div className="space-y-4">
            <h1 className="text-5xl lg:text-6xl xl:text-7xl font-black text-foreground leading-tight tracking-tight font-black">
              Acquire your <br /> First users <br /> From Reddit
            </h1>
          </div>

          {/* Subtitle */}
          <p className="text-lg lg:text-xl text-muted-foreground max-w-xl leading-relaxed">
            Turn Reddit into your customer acquisition engine. Get a proven posting strategy, safety-first templates, and analytics—so you attract real users without risking bans.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <Button variant="orange" size="lg" className="text-lg px-8 py-4 h-auto" onClick={() => navigate('/dashboard')}>
              Start my first campaign
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
              src="https://ik.imagekit.io/samudrua/RedditPilot/herolanding?updatedAt=1758307494266&tr=w-800,f-auto,q-85"
              srcSet="https://ik.imagekit.io/samudrua/RedditPilot/herolanding?updatedAt=1758307494266&tr=w-400,f-auto,q-85 400w,
                      https://ik.imagekit.io/samudrua/RedditPilot/herolanding?updatedAt=1758307494266&tr=w-800,f-auto,q-85 800w,
                      https://ik.imagekit.io/samudrua/RedditPilot/herolanding?updatedAt=1758307494266&tr=w-1200,f-auto,q-85 1200w"
              sizes="(max-width: 768px) 100vw, 50vw"
              alt="Founder using RedditPilot dashboard"
              className="w-full h-[600px] object-cover border-4 border-foreground"
              loading="eager"
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
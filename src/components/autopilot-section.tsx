import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { Plus, Power } from "lucide-react";

const AutopilotSection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-20 bg-slate-900 border-t-4 border-b-0 border-foreground">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left - Visual Image Card */}
          <div className="relative">
            <div className="bg-card rounded-2xl overflow-hidden shadow-brutal">
              <img
                src="https://ik.imagekit.io/samudrua/RedditPilot/post-template?updatedAt=1758315937467"
                alt="posting timeline"
                className="w-full h-64 sm:h-72 md:h-80 object-cover block"
              />
            </div>
          </div>

          {/* Right - Content */}
          <div>
            <h3 className="text-4xl lg:text-5xl font-black text-white mb-6">
              Follow your posting<br />timeline
            </h3>
            <p className="text-lg text-muted-foreground mb-8">
              Get your personalized posting schedule with ready-to-use templates that follow Reddit's best practices. Know exactly what to post and when.
            </p>
            <Button variant="secondary" size="lg" className="font-bold" onClick={() => navigate('/dashboard')}>
              Get My Timeline
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AutopilotSection;
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
            Your Reddit strategy, instantly
          </h2>
          <p className="text-lg text-muted-foreground max-w-4xl mx-auto">
            Answer a few questions about your product and audience. Get a complete growth plan tailored to you.
          </p>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left - Dashboard Card */}
          <div className="relative">
            {/* Single card with image filling it (no thick border) */}
            <div className="bg-card rounded-2xl overflow-hidden shadow-brutal">
              <img
                src="https://ik.imagekit.io/samudrua/RedditPilot/newproject?updatedAt=1758315937620&tr=w-900,h-450,f-auto,q-85"
                srcSet="https://ik.imagekit.io/samudrua/RedditPilot/newproject?updatedAt=1758315937620&tr=w-450,h-300,f-auto,q-85 450w,
                        https://ik.imagekit.io/samudrua/RedditPilot/newproject?updatedAt=1758315937620&tr=w-900,h-450,f-auto,q-85 900w"
                sizes="(max-width: 768px) 100vw, 50vw"
                alt="strategy overview"
                className="w-full h-64 sm:h-72 md:h-80 object-cover block"
                loading="lazy"
              />
            </div>
          </div>

          {/* Right - Content */}
          <div>
            <h3 className="text-4xl lg:text-5xl font-black text-white mb-6">
              Tailored to your<br />product & karma
            </h3>
            <p className="text-lg text-muted-foreground mb-8">
              Every strategy is personalized for your product category and Reddit karma level. Get a step-by-step posting plan that matches where you are today.
            </p>
            <Button variant="secondary" size="lg" className="font-bold" onClick={() => navigate('/dashboard')}>
              Create my plan
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MarketingBuilderSection;
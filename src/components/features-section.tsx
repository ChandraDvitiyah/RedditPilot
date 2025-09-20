import { ChartBar, Bot, Globe, FileEdit, MessageSquare, DollarSign } from "lucide-react";

const FeaturesSection = () => {
  const features = [
    {
      icon: Globe,
      title: "Unlimited Projects",
      description: "One Dashboard for all your Reddit projects, no limits to the number of projects you can create."
    },
    {
      icon: Bot,
      title: "Personalised Timeline",
      description: "Get a step-by-step posting schedule and plan personalised to your karma level."
    },
    {
      icon: FileEdit,
      title: "Tried and Tested templates",
      description: "Access proven post templates that go viral and convert without triggering spam filters."
    },
    {
      icon: ChartBar,
      title: "Accurate Analytics",
      description: "Get a deep understanding of target subreddits with clean analytics that remove the guesswork."
    },
  ];

  return (
    <section className="py-20 bg-background border-b-4 border-foreground">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center bg-card border-4 border-foreground rounded-full px-6 py-3 mb-8">
            <span className="text-sm font-bold text-foreground uppercase tracking-wider">
              EVERYTHING YOU NEED
            </span>
          </div>
          
          <h2 className="text-4xl lg:text-5xl xl:text-6xl font-black text-foreground mb-6 leading-tight">
            Reddit growth made simple
          </h2>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            RedditPilot gives founders and creators everything they need to grow on Reddit without the trial and error.
          </p>
        </div>

        {/* Features Grid - centered and enforced 2x2 on md+ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 justify-center max-w-4xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} className="bg-card border-4 border-foreground rounded-lg p-10 shadow-brutal">
                <div className="mb-6">
                  <div className="w-20 h-20 bg-foreground border-4 border-foreground rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-10 h-10 text-background" />
                  </div>
                  <h3 className="text-2xl font-black text-foreground mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground font-medium leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
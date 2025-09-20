import { Link } from "react-router-dom";

const MarketingCardsSection = () => {
  const cards = [
    {
      title: "App Alchemy",
      excerpt: "Diego Roshardt built and then scaled his AI SaaS to 17K+ MRR primarily through Reddit.",
      to: "/case-studies/app-alchemy",
      img: "https://ik.imagekit.io/samudrua/RedditPilot/appalchemy.png?updatedAt=1758358743174"
    },
    {
      title: "Sonar",
      excerpt: "A Micro SaaS that scaled to $200 MRR primarily through reddit in 2 months.",
      to: "/case-studies/sonar",
      img: "https://ik.imagekit.io/samudrua/RedditPilot/sonar.png?updatedAt=1758358743174"
    },
    {
      title: "Savewise",
      excerpt: "Avneesh grew his SaaS to $26k MRR mostly through Facebook and Reddit.",
      to: "/case-studies/savewise",
      img: "https://ik.imagekit.io/samudrua/RedditPilot/Savewise.png?updatedAt=1758358743098"
    }
  ];

  return (
    <section className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-left mb-12">
          <div className="inline-flex items-center rounded-full border border-gray-200 px-4 py-1 mb-4">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Case Studies</span>
          </div>

          <h2 className="text-4xl font-black text-foreground mb-2">A beginner's dive into marketing on reddit</h2>
          <p className="text-muted-foreground mb-8">How did these products succeed in marketing on reddit</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map((card, idx) => (
            <Link to={card.to} key={idx} className="block group">
              <div className="rounded-lg overflow-hidden border border-gray-200">
                <div className="bg-slate-900 h-44 md:h-56 flex items-center justify-center">
                  {/* Artwork image for the case study */}
                  {card.img ? (
                    <img src={card.img} alt={`${card.title} logo`} className="object-contain h-32 md:h-40" />
                  ) : (
                    <div className="w-24 h-24 bg-gradient-to-br from-slate-800 to-slate-700 rounded-md opacity-80"></div>
                  )}
                </div>

                <div className="bg-white p-4 md:p-6">
                  <h3 className="text-base font-semibold text-foreground mb-2 truncate">{card.title}</h3>
                  <p className="text-sm text-muted-foreground">{card.excerpt}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MarketingCardsSection;

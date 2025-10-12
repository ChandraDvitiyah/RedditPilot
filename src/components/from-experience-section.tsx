const FromExperienceSection = () => {
  return (
    <section className="py-20 bg-background border-b-4 border-foreground">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center bg-card border-4 border-foreground rounded-full px-6 py-3 mb-8">
            <span className="text-sm font-bold text-foreground uppercase tracking-wider">
              BUILT BY REDDIT VETERANS
            </span>
          </div>
          
          <h2 className="text-4xl lg:text-5xl xl:text-6xl font-black text-foreground mb-6 leading-tight">
            From Experience
          </h2>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            We've generated hundreds of thousands of impressions on Reddit ourselves. 
            RedditPilot is built from real experience, not theory.
          </p>
        </div>

        {/* Tilted Images Section */}
        <div className="relative max-w-4xl mx-auto mb-12">
          <div className="relative h-[400px] md:h-[500px]">
            {/* First Image - Tilted Left */}
            <div 
              className="absolute left-0 top-0 w-[60%] md:w-[55%] h-[350px] md:h-[450px] bg-card border-4 border-foreground shadow-brutal overflow-hidden"
              style={{ transform: 'rotate(-6deg)', zIndex: 1 }}
            >
              <div className="w-full h-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
                <div className="text-center p-6">
                  <img src="https://ik.imagekit.io/samudrua/RedditPilot/Group2.png?updatedAt=1760284071319" alt="Impressions Images from Reddit" />
                </div>
              </div>
            </div>

            {/* Second Image - Tilted Right, Overlapping */}
            <div 
              className="absolute right-0 top-12 md:top-8 w-[60%] md:w-[55%] h-[350px] md:h-[450px] bg-card border-4 border-foreground shadow-brutal overflow-hidden"
              style={{ transform: 'rotate(8deg)', zIndex: 2 }}
            >
              <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                <div className="text-center p-6">
                 <img src="https://ik.imagekit.io/samudrua/RedditPilot/Group1.png?updatedAt=1760284071290" alt="Impressions Images from Reddit" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Copy */}
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
            RedditPilot isn't built by marketers guessing what works. It's built by founders who've 
            been in the trenches, testing strategies, getting banned, learning the hard way, and 
            eventually cracking the code to consistent Reddit growth.
          </p>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Every feature, every template, every piece of advice comes from real campaigns that 
            drove real users. We've done the trial and error so you don't have to.
          </p>
        </div>
      </div>
    </section>
  );
};

export default FromExperienceSection;

const StatsSection = () => {
  return (
    <section className="py-20 bg-background border-t-4 border-b-4 border-foreground">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-lg text-muted-foreground font-semibold">
            Why Reddit is the perfect platform for your growth story?
          </h2>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Stat 1 */}
          <div className="bg-card border-4 border-foreground rounded-lg p-8 text-center shadow-brutal">
            <div className="text-4xl lg:text-5xl font-black text-foreground mb-2">
              1.36 billion
            </div>
            <div className="text-muted-foreground font-semibold">
              Monthly Active Users
            </div>
          </div>

          {/* Stat 2 */}
          <div className="bg-card border-4 border-foreground rounded-lg p-8 text-center shadow-brutal">
            <div className="text-4xl lg:text-5xl font-black text-foreground mb-2">
              20+ minutes
            </div>
            <div className="text-muted-foreground font-semibold">
              Spent per day
            </div>
          </div>

          {/* Stat 3 */}
          <div className="bg-card border-4 border-foreground rounded-lg p-8 text-center shadow-brutal">
            <div className="text-4xl lg:text-5xl font-black text-foreground mb-2">
              3.4 million
            </div>
            <div className="text-muted-foreground font-semibold">
              Active Subreddits
            </div>
          </div>

          {/* Stat 4 */}
          <div className="bg-card border-4 border-foreground rounded-lg p-8 text-center shadow-brutal">
            <div className="text-4xl lg:text-5xl font-black text-foreground mb-2">
              22+ billion
            </div>
            <div className="text-muted-foreground font-semibold">
              content created annually
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
import { Play } from "lucide-react";
import LazyYouTube from "@/components/ui/lazy-youtube";

const VideoDemoSection = () => {
  return (
    <section id="video-demo" className="py-20 bg-background border-t-4 border-b-4 border-foreground">
      <div className="max-w-7xl mx-auto px-6 text-center">
        {/* Header */}
        <div className="mb-16">
          <h2 className="text-4xl lg:text-6xl font-black text-foreground mb-4">
            See RedditPilot in action
          </h2>
          <p className="text-lg text-muted-foreground">
            Watch how founders set up their Reddit strategy in minutes.
          </p>
        </div>

        {/* Video Demo Interface */}
        <div className="max-w-5xl mx-auto">
          <div className="bg-card rounded-2xl p-0 shadow-brutal relative overflow-hidden min-w-0">
            {/* Small screens: keep 16:9 aspect; Medium+: larger fixed heights */}
            <div className="block md:hidden aspect-w-16 aspect-h-9 min-w-0">
              <LazyYouTube
                videoId="FhQ3-iGkLa8"
                title="RedditPilot Demo"
                className="w-full h-full block max-w-full"
              />
            </div>

            <div className="hidden md:block w-full md:h-[720px] lg:h-[840px] min-w-0">
              <LazyYouTube
                videoId="FhQ3-iGkLa8"
                title="RedditPilot Demo"
                className="w-full h-full block max-w-full"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VideoDemoSection;
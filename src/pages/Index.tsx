import Navigation from "@/components/ui/navigation";
import HeroSection from "@/components/hero-section";
import StatsSection from "@/components/stats-section";
import FeaturesSection from "@/components/features-section";
import MarketingBuilderSection from "@/components/marketing-builder-section";
import TargetingSection from "@/components/targeting-section";
import AutopilotSection from "@/components/autopilot-section";
import VideoDemoSection from "@/components/video-demo-section";
import PricingSection from "@/components/pricing-section";
import MarketingCardsSection from "@/components/marketing-cards-section";
import FAQSection from "@/components/faq-section";
import CTASection from "@/components/cta-section";
import Footer from "@/components/footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div id="hero">
        <HeroSection />
        <StatsSection />
      </div>
      <div id="features">
        <FeaturesSection />
        <MarketingBuilderSection />
        <TargetingSection />
        <AutopilotSection />
        <VideoDemoSection />
      </div>
      <div id="pricing">
        <PricingSection />
        <MarketingCardsSection />
      </div>
      <FAQSection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Index;

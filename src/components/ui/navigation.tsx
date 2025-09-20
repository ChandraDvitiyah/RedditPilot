import { Button } from "@/components/ui/button";
import { User } from "lucide-react";
import { Link } from "react-router-dom";

const Navigation = () => {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="w-full bg-background border-b-4 border-foreground px-6 py-4 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-orange-500 rounded"></div>
          <span className="text-xl font-bold text-foreground">RedditPilot</span>
        </div>

        {/* Navigation Menu */}
        <div className="hidden md:flex items-center space-x-8">
          <button 
            onClick={() => scrollToSection('hero')}
            className="text-foreground font-medium hover:opacity-80 transition-opacity"
          >
            Home
          </button>
          <button 
            onClick={() => scrollToSection('features')}
            className="text-foreground font-medium hover:opacity-80 transition-opacity"
          >
            Features
          </button>
          <button 
            onClick={() => scrollToSection('pricing')}
            className="text-foreground font-medium hover:opacity-80 transition-opacity"
          >
            Pricing
          </button>
          <button 
            onClick={() => scrollToSection('faq')}
            className="text-foreground font-medium hover:opacity-80 transition-opacity"
          >
            FAQ
          </button>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center space-x-4">
          <Link to="/dashboard">
            <Button variant="ghost" size="sm" className="hidden md:flex items-center space-x-2">
              <User className="w-4 h-4" />
              <span>Login</span>
            </Button>
          </Link>
          <Link to="/dashboard">
            <Button variant="brutal" size="sm" className="font-semibold">
              Get Started!
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
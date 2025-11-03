import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';

const CTASection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-20 bg-gradient-to-br from-purple-600 to-purple-800 border-t-4 border-b-4 border-foreground">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <h2 className="text-4xl lg:text-6xl font-black text-white mb-6">
          Ready to start growing on Reddit?
        </h2>
        <p className="text-lg text-purple-100 mb-12">
          Join founders building their startups with a proven Reddit growth system.
        </p>
        
        <div className="space-y-4">
          <Button 
            variant="secondary" 
            size="lg" 
            className="font-bold px-12 py-4 text-lg"
            onClick={() => navigate('/dashboard')}
          >
            Get started now
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
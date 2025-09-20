import MarketingCardsSection from '@/components/marketing-cards-section';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const CaseStudies = () => {
  const navigate = useNavigate();

  return (
    <div>
      <div className="max-w-7xl mx-auto px-6 pt-6">
        <Button
          variant="orange"
          size="sm"
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Button>
      </div>
      <MarketingCardsSection />
    </div>
  );
};

export default CaseStudies;

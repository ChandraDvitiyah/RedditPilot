import { TrendingUp, MessageCircle } from "lucide-react";

const FloatingCards = () => {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Sales Revenue Card */}
      <div className="absolute top-20 left-8 bg-card border-4 border-foreground rounded-lg p-6 shadow-brutal transform rotate-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-foreground rounded-full flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-background" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-semibold">Sales Revenue</p>
            <p className="text-2xl font-black text-foreground">84%</p>
          </div>
        </div>
      </div>

      {/* Message Card */}
      <div className="absolute bottom-32 right-8 bg-foreground border-4 border-foreground rounded-lg p-6 shadow-brutal transform -rotate-2 max-w-sm">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-background rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-foreground">RU</span>
          </div>
          <div>
            <p className="text-sm text-background font-semibold mb-1">Reddit Message</p>
            <p className="text-background font-bold">Whats the product?</p>
          </div>
        </div>
      </div>
    </div>
  );
};
export default FloatingCards;
import { useState } from 'react';
import { Play } from 'lucide-react';

interface LazyYouTubeProps {
  videoId: string;
  title: string;
  className?: string;
}

const LazyYouTube = ({ videoId, title, className = '' }: LazyYouTubeProps) => {
  const [isLoaded, setIsLoaded] = useState(false);

  const loadVideo = () => {
    setIsLoaded(true);
  };

  if (!isLoaded) {
    return (
      <div 
        className={`relative cursor-pointer group ${className}`}
        onClick={loadVideo}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && loadVideo()}
      >
        {/* Thumbnail from YouTube */}
        <img
          src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
          alt={title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        
        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
          <div className="w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center border-4 border-white shadow-xl group-hover:scale-110 transition-transform">
            <Play className="w-10 h-10 text-white fill-white ml-1" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <iframe
      className={className}
      src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
      title={title}
      frameBorder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    />
  );
};

export default LazyYouTube;

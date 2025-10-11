import React from 'react';
import { Link } from 'react-router-dom';

const FeaturedOn = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-20">
        <h1 className="text-4xl font-black mb-6">Featured On</h1>
        <p className="text-muted-foreground mb-8">A simple collection of places we've been featured.</p>
        <div className="flex flex-wrap gap-3">
          <a href="https://www.producthunt.com/products/redditpilot?launch=redditpilot" target="_blank" rel="noopener noreferrer" className="inline-block bg-card border-2 border-foreground text-foreground px-4 py-2 rounded-full text-sm font-medium">Product Hunt</a>
          <a href="https://viberank.dev/apps/RedditPilot" target="_blank" rel="noopener noreferrer" className="inline-block bg-card border-2 border-foreground text-foreground px-4 py-2 rounded-full text-sm font-medium">Viberanks</a>
          <a href="https://www.tinylaunch.com/launch/6800" target="_blank" rel="noopener noreferrer" className="inline-block bg-card border-2 border-foreground text-foreground px-4 py-2 rounded-full text-sm font-medium">TinyLaunch</a>
          <a href="https://fazier.com/launches/redditpilot" target="_blank" rel="noopener noreferrer" className="inline-block bg-card border-2 border-foreground text-foreground px-4 py-2 rounded-full text-sm font-medium">Fazier</a>
        </div>
      </div>
    </div>
  );
};

export default FeaturedOn;

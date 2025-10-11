const Footer = () => {
  return (
    <footer className="bg-slate-900 text-white py-16 border-t-4 border-foreground">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 gap-12 mb-12">
          {/* Company Info (minimal) */}
          <div>
            <div className="flex items-center space-x-2 mb-6">
              <div className="w-8 h-8 bg-orange-500 rounded"></div>
              <span className="text-2xl font-black">RedditPilot</span>
            </div>
            <div className="flex items-center mb-6">
              <p className="text-gray-300 leading-relaxed">
                The tool that helps founders grow on Reddit with guided playbooks and analytics.
              </p>
            </div>
          </div>
        </div>

        {/* Row above divider: empty left, badge aligned right (above Refund Policy) */}
        <div className="mb-6 flex items-center justify-between">
          <div className="w-2/3" />
          <div className="w-1/3 flex justify-end items-center space-x-4">
            <a href="https://fazier.com/launches/redditpilot.com" target="_blank" rel="noopener noreferrer" className="hidden sm:inline-block">
              <img src="https://fazier.com/api/v1//public/badges/launch_badges.svg?badge_type=featured&theme=light" alt="Fazier badge" width={140} />
            </a>
            <a href="https://findly.tools/redditpilot?utm_source=redditpilot" target="_blank" rel="noopener noreferrer" className="hidden sm:inline-block">
              <img src="https://findly.tools/badges/findly-tools-badge-dark.svg" alt="Featured on findly.tools" width={120} />
            </a>
          </div>
        </div>
        <div className="border-t border-gray-700 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm mb-4 md:mb-0">
            © 2022 RedditPilot. All rights reserved.
          </p>
          
          <div className="flex space-x-6 items-center">
            <a href="mailto:contact@redditpilot.com" className="text-gray-400 hover:text-white text-sm transition-colors">Contact</a>
            <a href="/terms" className="text-gray-400 hover:text-white text-sm transition-colors">Terms and Conditions</a>
            <a href="/privacy" className="text-gray-400 hover:text-white text-sm transition-colors">Privacy Policy</a>
            <a href="/refund" className="text-gray-400 hover:text-white text-sm transition-colors">Refund Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
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
            <p className="text-gray-300 mb-6 leading-relaxed">
              The tool that helps founders grow on Reddit with guided playbooks and analytics.
            </p>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-700 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm mb-4 md:mb-0">
            © 2022 RedditPilot. All rights reserved.
          </p>
          
          <div className="flex space-x-6 items-center">
            <a href="mailto:support@redditpilot.com" className="text-gray-400 hover:text-white text-sm transition-colors">Contact</a>
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
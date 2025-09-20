import { Link } from "react-router-dom";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>
        <p className="text-muted-foreground mb-4">
          Last updated: September 20, 2025
        </p>

        <h2 className="text-xl font-semibold mt-6">1. Information We Collect</h2>
        <p className="text-muted-foreground mb-4">
          We collect information you provide when you sign up (via Google authentication), and analytics data generated when you use the Service (for example subreddit analytics, top posts, and activity heatmaps). We also collect minimal technical information such as IP addresses and browser user agents for security and operational purposes.
        </p>

        <h2 className="text-xl font-semibold mt-6">2. How We Use Your Data</h2>
        <p className="text-muted-foreground mb-4">
          We use your data to provide, maintain, and improve RedditPilot. This includes storing analytics in our Supabase database, generating reports, and personalizing recommendations. We may also use aggregated, anonymized data for product research.
        </p>

        <h2 className="text-xl font-semibold mt-6">3. Third Party Services</h2>
        <p className="text-muted-foreground mb-4">
          Authentication is handled via Supabase and Google OAuth. Content and public post metadata used to generate analytics come from Reddit's APIs. We may use other third-party services to operate the Service; those services have their own privacy practices.
        </p>

        <h2 className="text-xl font-semibold mt-6">4. Data Retention and Deletion</h2>
        <p className="text-muted-foreground mb-4">
          We retain analytics and account data as long as your account exists or as needed to provide the Service. You may request deletion of your account and associated data by contacting support at support@redditpilot.com. We will comply with deletion requests subject to applicable legal obligations.
        </p>

        <h2 className="text-xl font-semibold mt-6">5. Cookies and Tracking</h2>
        <p className="text-muted-foreground mb-4">
          The Service may use cookies or similar technologies for session management, analytics, and security. You can control some tracking by adjusting your browser settings.
        </p>

        <h2 className="text-xl font-semibold mt-6">6. Security</h2>
        <p className="text-muted-foreground mb-4">
          We take reasonable measures to protect your data, including using Supabase for secure storage and following common security practices. However, no service is completely secure and we cannot guarantee absolute security.
        </p>

        <h2 className="text-xl font-semibold mt-6">7. Contact</h2>
        <p className="text-muted-foreground mb-8">
          For questions about this Privacy Policy or to request data deletion, contact support@redditpilot.com.
        </p>

        <div className="flex items-center space-x-4">
          <Link to="/terms">
            <button className="px-4 py-2 border border-gray-200 rounded">Terms</button>
          </Link>
          <Link to="/">
            <button className="px-4 py-2 bg-foreground text-background rounded">Home</button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Privacy;

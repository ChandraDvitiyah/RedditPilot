import { Link } from "react-router-dom";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Terms and Conditions</h1>
        <p className="text-muted-foreground mb-4">
          These Terms and Conditions ("Terms") govern your access to and use of RedditPilot (the "Service"). By using the Service you agree to be bound by these Terms. If you do not agree, do not use the Service.
        </p>

        <h2 className="text-xl font-semibold mt-6">1. Using RedditPilot</h2>
        <p className="text-muted-foreground mb-4">
          RedditPilot provides guided playbooks, analytics and tools to help founders and teams grow on Reddit. You are responsible for using the Service in compliance with Reddit's own rules and any applicable laws or community guidelines. We provide recommendations and analytics; you retain control over what you post and how you engage.
        </p>

        <h2 className="text-xl font-semibold mt-6">2. Accounts and Authentication</h2>
        <p className="text-muted-foreground mb-4">
          We use third party authentication (Google via Supabase) to sign you into the Service. You are responsible for maintaining the confidentiality of your account credentials. Do not share your account. We are not responsible for unauthorized access resulting from weak or compromised credentials.
        </p>

        <h2 className="text-xl font-semibold mt-6">3. Service Content and Analytics</h2>
        <p className="text-muted-foreground mb-4">
          Analytics data you create or store via RedditPilot (including subreddit analytics, top posts, and activity heatmaps) is stored in our Supabase instance. You grant RedditPilot the right to process and store this data for the purposes of providing the Service. We may aggregate or anonymize data for product improvement and research.
        </p>

        <p className="text-muted-foreground mb-4 font-medium">
          Disclaimer on Outcomes: While RedditPilot provides recommendations, playbooks, and analytics intended to improve community engagement, we cannot guarantee any specific results. Success with Reddit depends on many factors outside our control (community norms, timing, content quality, moderation, and chance). Use the Service as guidance — outcomes may vary and can involve an element of luck.
        </p>

        <h2 className="text-xl font-semibold mt-6">4. Acceptable Use</h2>
        <p className="text-muted-foreground mb-4">
          You may not use RedditPilot to facilitate spam, abuse, harassment, or any activity that violates Reddit’s rules or the rights of others. We may suspend or terminate access to accounts that violate these Terms.
        </p>

        <h2 className="text-xl font-semibold mt-6">5. Changes to the Service</h2>
        <p className="text-muted-foreground mb-4">
          We may modify, update, or discontinue features of the Service at any time. We will try to provide notice of material changes where practicable.
        </p>

        <h2 className="text-xl font-semibold mt-6">6. Limitation of Liability</h2>
        <p className="text-muted-foreground mb-4">
          To the maximum extent permitted by law, RedditPilot and its affiliates shall not be liable for indirect, incidental, special, consequential or punitive damages, or any loss of profits or revenues arising out of or related to your use of the Service.
        </p>

        <p className="text-muted-foreground mb-4">
          No Guarantee of Results: You acknowledge that RedditPilot does not promise or guarantee that use of the Service will lead to increased engagement, growth, or any particular outcome. Any examples, case studies, or forecasts are for illustrative purposes only and should not be relied upon as promises of future performance.
        </p>

        <h2 className="text-xl font-semibold mt-6">7. Governing Law</h2>
        <p className="text-muted-foreground mb-8">
          These Terms are governed by the laws of the jurisdiction in which RedditPilot operates, without regard to conflict of law provisions.
        </p>

        <div className="flex items-center space-x-4">
          <Link to="/">
            <button className="px-4 py-2 bg-foreground text-background rounded">Home</button>
          </Link>
          <Link to="/privacy">
            <button className="px-4 py-2 border border-gray-200 rounded">Privacy Policy</button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Terms;

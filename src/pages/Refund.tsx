import { Link } from "react-router-dom";

const Refund = () => {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Refund Policy</h1>

        <p className="text-muted-foreground mb-4">
          Effective: September 20, 2025
        </p>

        <h2 className="text-xl font-semibold mt-6">No Refunds</h2>
        <p className="text-muted-foreground mb-4">
          Due to the nature of the services provided by RedditPilot—real-time analytics, data processing, and digital deliverables that are generated immediately upon use—all sales are final. We do not provide refunds for subscription payments, one-time purchases, or credits once the product or service has been accessed or rendered.
        </p>

        <h2 className="text-xl font-semibold mt-6">Exceptions & Support</h2>
        <p className="text-muted-foreground mb-4">
          In the event of technical issues that prevent you from using the Service, please contact support at support@redditpilot.com. While refunds are not provided as a matter of course, we will evaluate exceptional situations on a case-by-case basis and may offer account credits or other remedies when appropriate.
        </p>

        <h2 className="text-xl font-semibold mt-6">Chargebacks</h2>
        <p className="text-muted-foreground mb-8">
          If you initiate a chargeback through your payment provider, we may contest the chargeback and provide evidence that the service was delivered or accessed.
        </p>

        <div className="flex items-center space-x-4">
          <Link to="/privacy">
            <button className="px-4 py-2 border border-gray-200 rounded">Privacy Policy</button>
          </Link>
          <Link to="/">
            <button className="px-4 py-2 bg-foreground text-background rounded">Home</button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Refund;

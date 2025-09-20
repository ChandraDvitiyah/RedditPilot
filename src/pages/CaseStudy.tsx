import { useParams, Link } from 'react-router-dom';
import React from 'react';

type CaseEntry = { title: string; body: React.ReactNode; metrics?: string[] };
const caseData: Record<string, CaseEntry> = {
  'app-alchemy': {
    title: 'App Alchemy',
    body: (
      <div>
        <p className="mb-4">Diego Roshardt launched his AI-powered app, AppAlchemy, without an existing audience or social media presence. Instead of relying on traditional marketing channels, he turned to Reddit, leveraging its communities to validate, promote, and scale his product.</p>

        <p className="mb-4">Within four months, Diego grew AppAlchemy to over <strong>$17,000</strong> in monthly recurring revenue (MRR). He attracted more than <strong>1,000 paying customers</strong> and secured upwards of <strong>20,000 signups</strong>, all driven by Reddit traffic. The app received around 20,000 monthly visitors, with marketing spend at zero.</p>

        <h3 className="text-lg font-semibold mb-2">Playbook</h3>
        <ol className="list-decimal ml-6 mb-4 text-muted-foreground">
          <li className="mb-2">He became an active Reddit user, building credibility and warming up his account to avoid content being filtered out.</li>
          <li className="mb-2">He created a targeted list of subreddits relevant to his product, using Reddit’s ad tools to identify communities with the right audience.</li>
          <li className="mb-2">His posts focused on providing genuine value and insights, rather than overt self-promotion. Successful posts started with eye-catching headlines and shared useful information before mentioning AppAlchemy.</li>
          <li className="mb-2">He posted across multiple subreddits, increasing exposure and the likelihood of reaching Reddit’s front page. Even without viral success, consistent posting generated significant traffic—ten posts averaging 10,000 views each meant 100,000 total impressions.</li>
          <li className="mb-2">Diego repeated this process, refining his approach and experimenting with different post formats to maximize engagement.</li>
        </ol>

        <p className="mb-4">By prioritizing authenticity and volume over aggressive sales tactics, Diego was able to capture attention, build trust, and drive conversions. His approach demonstrates how targeted Reddit marketing can deliver substantial growth, even without an established following.</p>

        <p className="text-sm italic text-muted-foreground mt-6">Disclaimer: AppAlchemy did not use RedditPilot. This case study is provided for illustrative purposes about Reddit marketing strategies generally and does not represent results achieved through RedditPilot specifically.</p>
      </div>
    ),
    metrics: ['$17K MRR', '≈1,000 paying customers', '≈20,000 signups']
  },
  'sonar': {
    title: 'Sonar',
    body: (
      <div>
        <h3 className="text-lg font-semibold mb-2">Snapshot</h3>
        <ul className="list-disc ml-6 mb-4 text-muted-foreground">
          <li>Product: Sonar — a tool to find validated startup ideas from Reddit</li>
          <li>Why Reddit: No existing audience required; communities surface real problems</li>
          <li>Revenue: ~$200/month</li>
        </ul>

        <h3 className="text-lg font-semibold mb-2">Goal</h3>
        <p className="mb-4">Validate product-market fit by finding startup ideas that already have demand on Reddit and convert engaged users into early customers.</p>

        <h3 className="text-lg font-semibold mb-2">Why Reddit</h3>
        <p className="mb-4">Reddit surfaces real, moment-driven problems and questions. You don't need an audience — relevant subreddits already gather people actively discussing pain points and solutions.</p>

        <h3 className="text-lg font-semibold mb-2">Strategy</h3>
        <ol className="list-decimal ml-6 mb-4 text-muted-foreground">
          <li className="mb-2">Pick target subreddits that regularly discuss product ideas, requests, or solutions.</li>
          <li className="mb-2">Write recurring posts that surface interesting threads (e.g., 'Weekly idea roundup' or 'What product would you pay for?') and use them to test hypotheses.</li>
          <li className="mb-2">Plug the product organically by sharing a case study or a small tool that helps answer a common question, then request feedback.</li>
        </ol>

        <h3 className="text-lg font-semibold mb-2">Execution</h3>
        <p className="mb-4">Sonar launched with recurring weekly posts curated to highlight validated ideas and noticed which topics generated the most engagement. The founder would follow up on high-signal threads and prototype small tools or dashboards that addressed those needs.</p>

        <h3 className="text-lg font-semibold mb-2">Outcomes</h3>
        <ul className="list-disc ml-6 mb-4 text-muted-foreground">
          <li>Early traction: ~$200/month in recurring revenue within a few months.</li>
          <li>High signal: community-sourced ideas led to product pivots and clearer positioning.</li>
        </ul>

        <h3 className="text-lg font-semibold mb-2">Playbook</h3>
        <p className="mb-4">Map 6–10 subreddits, run weekly recurring posts to surface ideas, curate top threads into a short roundup, prototype solutions for top requests, and convert interested community members into early users.</p>

        <h3 className="text-lg font-semibold mb-2">Key Takeaway</h3>
        <p className="mb-4">Reddit allows founders to discover and validate startup ideas quickly without paid acquisition. Consistent, value-first recurring posts can surface high-quality, validated problems to build on.</p>

        <p className="text-sm italic text-muted-foreground mt-6">Disclaimer: This case study is illustrative of Reddit marketing and product-validation practices. Sonar's example is not an endorsement of RedditPilot and does not imply results achieved through our product.</p>
      </div>
    ),
    metrics: ['$200 MRR', 'Early prototypes validated via Reddit']
  },
  'savewise': {
    title: 'Savewise',
    body: (
      <div>
        <h3 className="text-lg font-semibold mb-2">Snapshot</h3>
        <ul className="list-disc ml-6 mb-4 text-muted-foreground">
          <li>Product: Savewise (earn more credit-card points/miles on purchases)</li>
          <li>Stage: Bootstrapped, solo founder</li>
          <li>Outcome: ~$25K/month revenue, tens of thousands of users, ~1,500 paying customers</li>
          <li>Channel Focus: Reddit (community-led acquisition)</li>
        </ul>

        <h3 className="text-lg font-semibold mb-2">Goal</h3>
        <p className="mb-4">Find early users who actually care about maximizing points/miles—and turn their feedback loops into product-market pull, without paid ads.</p>

        <h3 className="text-lg font-semibold mb-2">Why Reddit</h3>
        <ul className="list-disc ml-6 mb-4 text-muted-foreground">
          <li>High-intent, problem-native communities (credit cards, travel hacking, deal-stacking).</li>
          <li>Comment-first culture enables low-risk testing of value props and feature gaps.</li>
          <li>Mods/weekly threads provide structured, “allowed” promotional pathways when done right.</li>
        </ul>

        <h3 className="text-lg font-semibold mb-2">Strategy (Reddit-Only)</h3>
        <ol className="list-decimal ml-6 mb-4 text-muted-foreground">
          <li className="mb-2">Map the Right Subreddits: Brainstorm 5–15 interest clusters and use mapping tools to find adjacent micro-communities.</li>
          <li className="mb-2">Lurk Before You Post: Observe language, norms, and identify allowed posting surfaces.</li>
          <li className="mb-2">Comment &gt; Post: Start in weekly comment threads, ask for feedback, share helpful tips, and measure resonance.</li>
          <li className="mb-2">Close the Feedback Loop: Build features requested in threads and return with tangible improvements.</li>
          <li className="mb-2">Mod Alignment → Top-Level Launch: After ~3.5 months, DM mods and publish a value-first top-level post.</li>
          <li className="mb-2">Alerts to Stay Timely: Use keyword alerts to jump into fresh threads with relevant answers.</li>
        </ol>

        <h3 className="text-lg font-semibold mb-2">Execution Timeline</h3>
        <p className="mb-4">Weeks 1–2: Research subs and norms. Weeks 3–12: Weekly commenting cadence and iterative product updates. Month ~3.5: Secure mod approval and ship the top-level post.</p>

        <h3 className="text-lg font-semibold mb-2">Numbers & Outcomes</h3>
        <ul className="list-disc ml-6 mb-4 text-muted-foreground">
          <li>Business-wide: ~$25,000/month revenue; tens of thousands of users; ~1,500 paying customers.</li>
          <li>Reddit-specific: Repeated presence in weekly threads, mod-approved top post that drove a major inflection; exact Reddit-only traffic counts not provided.</li>
        </ul>

        <h3 className="text-lg font-semibold mb-2">What Made Reddit Work</h3>
        <ul className="list-disc ml-6 mb-4 text-muted-foreground">
          <li>Precision audience fit: targeted the right subs.</li>
          <li>Cultural fit: comment-first, useful contributions.</li>
          <li>Iterative credibility: shipping features requested by community.</li>
          <li>Mod partnership: permission plus timing for maximal exposure.</li>
          <li>Speed to relevance: keyword alerts kept him present in fresh conversations.</li>
        </ul>

        <h3 className="text-lg font-semibold mb-2">Playbook You Can Copy</h3>
        <p className="mb-4">Identify 5–15 user-interest keywords; map 6–10 target subs; spend 2 weeks observing; run a 6–10 week comment sprint; track signals and ship requested features; DM mods for a compliant top post; maintain alerts.</p>

        <h3 className="text-lg font-semibold mb-2">Key Takeaway</h3>
        <p className="mb-4">Reddit supplied both users and the product roadmap. By embedding in comment threads first and launching with mod buy-in, Avneesh converted Reddit into durable demand without paid ads.</p>

        <p className="text-sm italic text-muted-foreground mt-6">Disclaimer: This case study summarizes Savewise's Reddit strategy and outcomes. It is illustrative of Reddit marketing practices; Savewise did not necessarily use RedditPilot, and this case study does not imply endorsement or results from RedditPilot.</p>
      </div>
    ),
    metrics: ['$25K MRR', '≈1,500 paying customers']
  }
};

const CaseStudy = () => {
  const { slug } = useParams<{ slug: string }>();
  const data = slug ? caseData[slug] : null;

  if (!data) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">Case study not found</h2>
          <p className="text-muted-foreground mb-6">We couldn't find the case study you're looking for.</p>
          <Link to="/case-studies" className="inline-block px-4 py-2 bg-foreground text-background rounded">Back to Case Studies</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
  <h1 className="text-3xl font-black mb-2">{data.title}</h1>
  <div className="text-muted-foreground mb-6">{data.body}</div>

        {data.metrics && (
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-2">Key metrics</h3>
            <ul className="list-disc ml-6 text-muted-foreground">
              {data.metrics.map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex space-x-4">
          <Link to="/case-studies" className="px-4 py-2 border border-gray-200 rounded">Back</Link>
          <Link to="/" className="px-4 py-2 bg-foreground text-background rounded">Home</Link>
        </div>
      </div>
    </div>
  );
};

export default CaseStudy;

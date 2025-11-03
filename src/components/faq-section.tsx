import { useState } from "react";
import { ChevronDown } from "lucide-react";

const FAQSection = () => {
  const [openItems, setOpenItems] = useState<number[]>([]);

  const toggleItem = (index: number) => {
    setOpenItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const faqs = [
    {
      question: "How quickly can I start seeing results?",
      answer: "Results vary based on your product, target audience, and consistency. Most founders who follow the timeline see engagement and early traction within their first few weeks of posting. Success depends on product-market fit and execution."
    },
    {
      question: "Will I get banned?",
      answer: "Our templates and timelines are designed specifically to avoid bans. We account for your karma level and give you posting schedules that build trust with communities before promoting. Follow the guidance, and you'll stay compliant with Reddit's rules."
    },
    {
      question: "Do I need Reddit experience?",
      answer: "No. RedditPilot is built for founders with zero Reddit experience. You'll get step-by-step guidance, ready-to-use templates, and timing recommendations—everything you need to start safely."
    },
    {
      question: "Can I use this for multiple products?",
      answer: "Yes. Your one-time payment includes unlimited projects. Create separate timelines and strategies for each product you're launching."
    },
    {
      question: "What if my product doesn't fit a template?",
      answer: "RedditPilot supports SaaS, education, skincare, and general products. Our templates are flexible and can be adapted to most niches. Plus, you get subreddit suggestions tailored to your category."
    },
    {
      question: "What's your refund policy?",
      answer: "Due to the instant delivery of digital services and analytics, all sales are final. We evaluate exceptional technical issues on a case-by-case basis. Please review our full refund policy for details."
    },
  ];

  return (
    <section id="faq" className="py-20 bg-background border-t-4 border-foreground">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-6xl font-black text-foreground mb-4">
            Common questions
          </h2>
          <p className="text-lg text-muted-foreground">
            Everything you need to know to get started
          </p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div 
              key={index}
              className="bg-card border-4 border-foreground rounded-2xl overflow-hidden shadow-brutal"
            >
              <button
                onClick={() => toggleItem(index)}
                className="w-full px-8 py-6 text-left flex items-center justify-between hover:bg-muted/20 transition-colors"
              >
                <h3 className="text-lg font-bold text-foreground pr-4">
                  {faq.question}
                </h3>
                <ChevronDown 
                  className={`w-6 h-6 text-foreground transition-transform ${
                    openItems.includes(index) ? 'rotate-180' : ''
                  }`}
                />
              </button>
              
              {openItems.includes(index) && (
                <div className="px-8 pb-6 border-t-2 border-muted">
                  <p className="text-muted-foreground pt-4 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
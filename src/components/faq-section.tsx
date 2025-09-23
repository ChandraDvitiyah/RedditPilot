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
      question: "Why Reddit?",
      answer: "Reddit is one of the largest social platforms on the internet and one which allows you to target specific communities and without any special algorithm or a large following."
    },
    {
      question: "Is RedditPilot beginner friendly?",
      answer: "RedditPilot can support a wide range of users, from beginners to experienced marketers. The personalised timeline will be designed to be easy to follow, with clear instructions and templates that anyone can use."
    },
    {
      question: "What's in for the user?",
      answer: "You will get a centralised dashboard for all your projects, personalised timeline for each of the projects and also validated templates along with a detailed Subreddit Analytics tool."
    },
    {
      question: "How do I know when and what to post?",
      answer: "RedditPilot's subreddit analytics help you identify the best times and days to post for your specific project or business. And for each post in your timeline, you'll get a recommended template which you can use."
    },
    {
      question: "Can I use this for multiple projects?",
      answer: "Yes! With your one-time $29 payment, you get lifetime access to set up an infinite number of projects within RedditPilot. Each project can have its own strategy and timeline."
    },
    {
      question: "Is the result guaranteed?",
      answer: "RedditPilot does not guarantee specific results. While we provide tools and recommendations, success depends on various factors beyond our control."
    },
  ];

  return (
    <section id="faq" className="py-20 bg-background border-t-4 border-foreground">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-6xl font-black text-foreground mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-muted-foreground">
            Everything you need to know about RedditPilot
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
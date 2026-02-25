import React, { useState } from "react";
import { Minus, Plus } from "lucide-react";

const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: "How do I create an account?",
      answer:
        "Use Sign Up and choose Student or Company. After registration, verify your email to continue.",
    },
    {
      question: "How do I apply for internships?",
      answer:
        "Open a job post and click Apply. Your application status updates in your dashboard.",
    },
    {
      question: "What if I find a suspicious job post?",
      answer:
        "Use the report option inside the platform. Reported posts are reviewed by admin.",
    },
    {
      question: "Is InternNepal free for students?",
      answer:
        "Yes. Students can create profiles, browse internships, save jobs, and apply without payment.",
    },
  ];

  return (
    <section className="bg-slate-50 px-4 py-20 dark:bg-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-extrabold text-slate-900 dark:text-white sm:text-4xl md:text-5xl">
            Everything You Need to Know About <span className="text-blue-600">InternNepal</span>
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className="overflow-hidden rounded-lg border border-blue-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="flex w-full items-center justify-between bg-blue-50 px-6 py-4 text-left transition hover:bg-blue-100 dark:bg-slate-800 dark:hover:bg-slate-700"
                >
                  <p className="font-bold text-slate-900 dark:text-white">{faq.question}</p>
                  {isOpen ? (
                    <Minus size={18} className="shrink-0 text-blue-600" />
                  ) : (
                    <Plus size={18} className="shrink-0 text-blue-600" />
                  )}
                </button>
                {isOpen && (
                  <div className="bg-slate-50 px-6 py-4 dark:bg-slate-900">
                    <p className="text-slate-600 dark:text-slate-300">{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;

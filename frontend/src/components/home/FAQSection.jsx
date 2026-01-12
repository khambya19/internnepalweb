import React, { useState } from "react";

const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState(null);
  
  const faqs = [
    { question: "How do I create an account?", answer: "Click 'Sign Up' to create your profile. It takes less than 2 minutes!" },
    { question: "Are all internships verified?", answer: "Yes! All opportunities on InternNepal are verified for legitimacy." },
    { question: "How do I apply for a job?", answer: "Click 'Apply Now' on any job listing. You can apply with one click if your profile is complete." },
    { question: "Is InternNepal free for job seekers?", answer: "Yes! Job seekers can use InternNepal completely free." }
  ];

  return (
    <section className="bg-slate-50 py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 mb-4">
            Everything You Need to Know About <span className="text-blue-600">InternNepal</span>
          </h2>
        </div>
        
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="border border-blue-100 rounded-lg overflow-hidden bg-white shadow-sm">
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex justify-between items-center bg-blue-50 hover:bg-blue-100 px-6 py-4 transition"
              >
                <p className="font-bold text-slate-900 text-left">{faq.question}</p>
                <span className="text-blue-600 font-bold">
                  {openIndex === index ? "−" : "+"}
                </span>
              </button>
              {openIndex === index && (
                <div className="px-6 py-4 bg-slate-50">
                  <p className="text-slate-500">{faq.answer}</p>
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

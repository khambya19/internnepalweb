import React from "react";

const Features = () => {
  const features = [
    { icon: "🎯", title: "Smart Matching", description: "Job recommendations tailored to your skills and interests" },
    { icon: "⚡", title: "Quick Apply", description: "One-click application process to save time" },
    { icon: "📊", title: "Track Progress", description: "Monitor your applications in real-time" },
    { icon: "🔒", title: "Verified Jobs", description: "All opportunities verified for legitimacy" },
    { icon: "💬", title: "Direct Chat", description: "Connect directly with hiring managers" },
    { icon: "🏆", title: "Top Companies", description: "Access internships from leading companies" }
  ];

  return (
    <section className="bg-blue-50 py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
            Tools to Accelerate <span className="text-blue-600">Your Hiring Process</span>
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition transform hover:-translate-y-1">
              <p className="text-4xl mb-4">{feature.icon}</p>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-500 text-sm">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
	    );
};
export default Features;

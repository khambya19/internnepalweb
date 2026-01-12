import React from "react";

const Stats = () => {
  const stats = [
    { number: "5,000+", label: "Internships Posted" },
    { number: "95%", label: "Success Rate" },
    { number: "$12.5M+", label: "Total Opportunity Value" },
    { number: "4.8", label: "Average Rating" }
  ];

  return (
    <section className="bg-slate-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <p className="text-3xl sm:text-4xl font-extrabold text-blue-600 mb-2">
                {stat.number}
              </p>
              <p className="text-sm sm:text-base text-slate-500">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Stats;


import React from "react";

const JobExplore = () => {
  // Converted to Nepali Rupees (approx. 1 USD = 133 NPR as of 2026)
  // More reasonable Nepali internship/entry-level salaries
  // Salaries now range from 1 lakh to 2 lakh NPR
  const jobs = [
    { company: "Google", title: "UX Designer", salary: 100000, location: "Remote" },
    { company: "Microsoft", title: "Backend Developer", salary: 120000, location: "Hybrid" },
    { company: "Meta", title: "Product Manager", salary: 200000, location: "Remote" },
    { company: "Amazon", title: "Data Analyst", salary: 150000, location: "Onsite" },
    { company: "Apple", title: "iOS Developer", salary: 180000, location: "Remote" }
  ];

  return (
    <section className="bg-white py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
            Start Exploring <span className="text-blue-600">Thousands of Jobs Made for You</span>
          </h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">
            Find your perfect internship or first job opportunity
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job, index) => (
            <div key={index} className="bg-blue-50 rounded-lg p-6 border-l-4 border-blue-600 hover:shadow-lg transition">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{job.title}</h3>
                  <p className="text-sm text-gray-500">{job.company}</p>
                </div>
                <span className="text-xs font-semibold text-pink-500 bg-pink-100 px-3 py-1 rounded-full">
                  {job.location}
                </span>
              </div>
              <p className="text-blue-600 font-bold text-lg mb-4">
                रू {job.salary.toLocaleString('en-IN')} /month
              </p>
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition">
                View Job
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default JobExplore;

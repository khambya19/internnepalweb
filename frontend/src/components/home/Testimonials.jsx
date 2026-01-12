import React from "react";

const Testimonials = () => {
  const testimonials = [
    { name: "Isha Poudel", role: "Software Developer at Google", text: "InternNepal helped me find my dream internship. The platform is easy to use and the jobs are legitimate." },
    { name: "Raj Sharma", role: "Product Designer at Microsoft", text: "I landed my first job through InternNepal. Highly recommended for anyone starting their career!" },
    { name: "Priya Gupta", role: "Data Analyst at Meta", text: "The matching algorithm is impressive. I got job recommendations that perfectly fit my skills." }
  ];

  return (
    <section className="bg-slate-50 py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 mb-4">
            Real Experiences from <span className="text-blue-600">Candidates & Companies</span>
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition border border-blue-100">
              <p className="text-slate-500 italic mb-6 text-base">
                "{testimonial.text}"
              </p>
              <div className="border-t pt-4">
                <p className="font-bold text-slate-900">{testimonial.name}</p>
                <p className="text-sm text-blue-600">{testimonial.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
	  );
};
export default Testimonials;

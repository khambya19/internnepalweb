import React from "react";
import { useNavigate } from "react-router-dom";

const CTA = () => {
  const navigate = useNavigate();
  return (
    <section className="bg-gradient-to-r from-blue-600 via-violet-600 to-cyan-500 py-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center min-h-[350px] md:min-h-[400px]">
      <div className="max-w-4xl w-full mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-6 leading-tight">
          It's Time to <span className="text-cyan-500">Find Great Talent</span> Effortlessly
        </h2>
        <p className="text-lg text-slate-50 mb-10 max-w-2xl mx-auto">
          Start your journey with InternNepal today. Whether you're looking for your first internship or hiring your next team member.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4 w-full">
          <button
            className="bg-blue-600 text-white font-bold py-3 px-8 rounded-full shadow-lg transition hover:bg-blue-700 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-blue-600 text-base md:text-lg"
            onClick={() => navigate('/login')}
          >
            Get Started Now
          </button>
          <button className="bg-cyan-500 text-white font-bold py-3 px-8 rounded-full shadow-lg transition hover:bg-cyan-600 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-base md:text-lg">
            Learn More
          </button>
        </div>
      </div>
    </section>
	  );
};
export default CTA;

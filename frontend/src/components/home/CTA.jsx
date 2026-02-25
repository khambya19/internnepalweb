import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Building2, UserRound } from "lucide-react";

const CTA = () => {
  const navigate = useNavigate();
  return (
    <section className="flex min-h-[350px] items-center justify-center bg-gradient-to-r from-blue-600 via-violet-600 to-cyan-500 px-4 py-16 dark:from-slate-900 dark:via-blue-950 dark:to-slate-900 sm:px-6 md:min-h-[400px] lg:px-8">
      <div className="max-w-4xl w-full mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-6 leading-tight">
          It's Time to <span className="text-cyan-500">Find Great Talent</span> Effortlessly
        </h2>
        <p className="mx-auto mb-10 max-w-2xl text-lg text-slate-50 dark:text-slate-300">
          Start your journey with InternNepal today. Whether you're looking for your first internship or hiring your next team member.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4 w-full">
          <button
            className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-8 py-3 text-base font-bold text-white shadow-lg transition hover:-translate-y-1 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 md:text-lg"
            onClick={() => navigate('/login')}
          >
            <UserRound size={18} />
            Get Started Now
          </button>
          <button
            className="inline-flex items-center justify-center gap-2 rounded-full bg-cyan-500 px-8 py-3 text-base font-bold text-white shadow-lg transition hover:-translate-y-1 hover:bg-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 md:text-lg"
            onClick={() => navigate('/register')}
          >
            <Building2 size={18} />
            Create Company Account
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </section>
	  );
};
export default CTA;

import React from 'react';

const Hero = () => {
  return (
    <section
      className="relative bg-cover bg-center bg-no-repeat pt-32 pb-28"
      style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.55), rgba(0, 0, 0, 0.55)),
                          url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2340&q=80')`,
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
          Find Your Dream Internship in Nepal
        </h1>
        <p className="text-xl md:text-2xl mb-12 max-w-3xl mx-auto">
          Connect with top companies and kickstart your career
        </p>

        {/* Search Bar */}
        <form className="max-w-5xl mx-auto mb-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <input
            type="text"
            placeholder="Keyword (e.g., IT, Marketing, Design)"
            className="px-6 py-4 rounded-lg text-black text-lg focus:outline-none focus:ring-4 focus:ring-blue-400"
          />
          <input
            type="text"
            placeholder="Location (e.g., Kathmandu, Pokhara)"
            className="px-6 py-4 rounded-lg text-black text-lg focus:outline-none focus:ring-4 focus:ring-blue-400"
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-10 rounded-lg text-lg transition"
          >
            Search Internships
          </button>
        </form>

        {/* CTA Buttons */}
        <div>
          <a
            href="#"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold px-12 py-5 rounded-lg text-xl mr-8 transition"
          >
            Browse All
          </a>
          <a
            href="#"
            className="inline-block border-3 border-white hover:bg-white hover:text-black text-white font-bold px-12 py-5 rounded-lg text-xl transition"
          >
            Post Internship Free
          </a>
        </div>
      </div>
    </section>
  );
};

export default Hero;
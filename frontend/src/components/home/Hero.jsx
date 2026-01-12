import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play } from 'lucide-react';

const Hero = () => {
  const navigate = useNavigate();
  const sectionRef = useRef(null);
  useEffect(() => {
    const section = sectionRef.current;
    if (section) {
      section.classList.add('fade-in-hero');
    }
  }, []);
  return (
    <section ref={sectionRef} className="relative pt-32 pb-20 bg-slate-50 overflow-hidden min-h-screen flex flex-col justify-center opacity-0">
      
      {/* Background Decor (Clouds/Blobs) */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-violet-600 rounded-full blur-2xl opacity-30"></div>
      <div className="absolute top-40 right-20 w-32 h-32 bg-blue-600 rounded-full blur-3xl opacity-30"></div>
      <div className="absolute bottom-10 left-1/3 w-40 h-40 bg-cyan-500 rounded-full blur-3xl opacity-20"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        
        {/* 1. Headline with Emojis */}
        <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 leading-tight mb-8">
          Smart Hiring <span className="inline-block animate-bounce">🤖</span> Solutions for <br />
          Your <span className="inline-block animate-bounce delay-100">👥</span> Growing Needs
        </h1>
        
        {/* 2. Subheadline */}
        <p className="text-xl text-slate-500 mb-10 max-w-2xl mx-auto">
          InternNepal blends intelligent <span className="text-cyan-500 font-bold">technology</span> with professional hiring expertise to help companies build exceptional teams.
        </p>

        {/* 3. Buttons (Pink & White) */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20 w-full">
          <button
            className="bg-blue-600 text-white px-8 py-4 rounded-full font-bold shadow-lg transition hover:bg-blue-700 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-blue-600 text-base md:text-lg"
            onClick={() => navigate('/login')}
          >
            Get Started 🚀
          </button>
          <button className="bg-cyan-500 text-white px-8 py-4 rounded-full font-bold shadow-lg transition hover:bg-cyan-600 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-cyan-500 flex items-center gap-2 text-base md:text-lg">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white">
              <Play size={12} fill="white" />
            </div>
            Watch Demo
          </button>
        </div>

        {/* 4. The "Fan" of Cards (Visual Representation) */}
        <div className="relative h-64 md:h-80 max-w-4xl mx-auto perspective-1000">
          
          {/* Card 1: Far Left (Purple) */}
          <div className="absolute left-0 md:left-20 top-10 w-48 md:w-56 bg-violet-600/10 p-4 rounded-2xl border-2 border-white shadow-xl transform -rotate-12 transition hover:-translate-y-4 duration-300">
             <div className="flex items-center gap-3 mb-3">
               <div className="w-10 h-10 bg-violet-600/30 rounded-full flex items-center justify-center">👾</div>
               <div className="text-left">
                 <div className="h-2 w-16 bg-violet-600/40 rounded mb-1"></div>
                 <div className="h-2 w-10 bg-violet-600/20 rounded"></div>
               </div>
             </div>
             <div className="h-2 w-full bg-violet-600/20 rounded mb-2"></div>
             <div className="h-8 w-full bg-violet-600 rounded-lg mt-2 text-white text-xs font-bold flex items-center justify-center">Apply</div>
          </div>

          {/* Card 2: Left (Orange) */}
          <div className="absolute left-10 md:left-48 top-4 w-48 md:w-56 bg-cyan-500/10 p-4 rounded-2xl border-2 border-white shadow-xl transform -rotate-6 z-10 transition hover:-translate-y-4 duration-300">
             <div className="flex items-center gap-3 mb-3">
               <div className="w-10 h-10 bg-cyan-500/30 rounded-full flex items-center justify-center">🦊</div>
               <div className="text-left">
                 <div className="h-2 w-20 bg-cyan-500/40 rounded mb-1"></div>
                 <div className="h-2 w-12 bg-cyan-500/20 rounded"></div>
               </div>
             </div>
             <div className="h-2 w-full bg-cyan-500/20 rounded mb-2"></div>
             <div className="h-8 w-full bg-cyan-500 rounded-lg mt-2 text-white text-xs font-bold flex items-center justify-center">Apply</div>
          </div>

          {/* Card 3: Center (Green - Main) */}
          <div className="absolute left-0 right-0 mx-auto -top-6 w-56 md:w-64 bg-white p-5 rounded-3xl border-2 border-cyan-500 shadow-2xl z-20 transform hover:scale-105 transition duration-300">
             <div className="flex justify-between items-start mb-4">
               <div className="w-12 h-12 bg-cyan-500/10 rounded-2xl flex items-center justify-center text-2xl">🎨</div>
               <span className="bg-cyan-500/10 text-cyan-500 text-xs font-bold px-2 py-1 rounded-full">Remote</span>
             </div>
             <h3 className="text-lg font-bold text-slate-900 text-left">Product Designer</h3>
             <p className="text-slate-500 text-sm text-left mb-4">Spotify, Inc.</p>
             <div className="flex -space-x-2 mb-4">
                 {[1,2,3].map(i => <div key={i} className="w-8 h-8 rounded-full bg-slate-50 border-2 border-white"></div>)}
             </div>
             <button className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-blue-700">Apply Now</button>
          </div>

          {/* Card 4: Right (Pink) */}
          <div className="absolute right-10 md:right-48 top-4 w-48 md:w-56 bg-violet-600/10 p-4 rounded-2xl border-2 border-white shadow-xl transform rotate-6 z-10 transition hover:-translate-y-4 duration-300">
             <div className="flex items-center gap-3 mb-3">
               <div className="w-10 h-10 bg-violet-600/30 rounded-full flex items-center justify-center">🎀</div>
               <div className="text-left">
                 <div className="h-2 w-16 bg-violet-600/40 rounded mb-1"></div>
                 <div className="h-2 w-10 bg-violet-600/20 rounded"></div>
               </div>
             </div>
             <div className="h-2 w-full bg-violet-600/20 rounded mb-2"></div>
             <div className="h-8 w-full bg-violet-600 rounded-lg mt-2 text-white text-xs font-bold flex items-center justify-center">Apply</div>
          </div>

          {/* Card 5: Far Right (Blue) */}
          <div className="absolute right-0 md:right-20 top-10 w-48 md:w-56 bg-blue-600/10 p-4 rounded-2xl border-2 border-white shadow-xl transform rotate-12 transition hover:-translate-y-4 duration-300">
             <div className="flex items-center gap-3 mb-3">
               <div className="w-10 h-10 bg-blue-600/30 rounded-full flex items-center justify-center">💎</div>
               <div className="text-left">
                 <div className="h-2 w-20 bg-blue-600/40 rounded mb-1"></div>
                 <div className="h-2 w-12 bg-blue-600/20 rounded"></div>
               </div>
             </div>
             <div className="h-2 w-full bg-blue-600/20 rounded mb-2"></div>
             <div className="h-8 w-full bg-blue-600 rounded-lg mt-2 text-white text-xs font-bold flex items-center justify-center">Apply</div>
          </div>

        </div>

        {/* Company Logos (Optional row at bottom) */}
        <div className="mt-12 opacity-50 grayscale flex justify-center gap-8">
           {/* You can add logo svgs here if you want */}
        </div>

      </div>
    </section>
  );
};

export default Hero;
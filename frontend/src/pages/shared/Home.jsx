import React from 'react';
import Hero from '../../components/home/Hero';
import Stats from '../../components/home/Stats';
import Features from '../../components/home/Features';
import JobExplore from '../../components/home/JobExplore';
import Testimonials from '../../components/home/Testimonials';
import FAQSection from '../../components/home/FAQSection';
import CTA from '../../components/home/CTA';


import { useEffect, useRef } from 'react';

const Home = () => {
  const homeRef = useRef(null);
  useEffect(() => {
    const el = homeRef.current;
    if (el) {
      el.classList.add('fade-in-hero');
    }
  }, []);
  return (
    <div ref={homeRef} className="opacity-0">
      <Hero />
      <Stats />
      <Features />
      <JobExplore />
      <Testimonials />
      <FAQSection />
      <CTA />
    </div>
  );
};

export default Home;
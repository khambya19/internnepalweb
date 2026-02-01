import React from "react";

const Footer = () => {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white py-12 text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="mb-6 text-lg text-slate-700 dark:text-slate-300">© 2026 InternNepal. All rights reserved.</p>
        <div className="space-x-10 text-lg">
          <a href="#" className="font-semibold transition hover:text-cyan-600 dark:hover:text-cyan-400">
            Privacy Policy
          </a>
          <a href="#" className="font-semibold transition hover:text-cyan-600 dark:hover:text-cyan-400">
            Terms of Service
          </a>
          <a href="#" className="font-semibold transition hover:text-cyan-600 dark:hover:text-cyan-400">
            Contact Us
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

import React from "react";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-lg mb-6">© 2026 InternNepal. All rights reserved.</p>
        <div className="space-x-10 text-lg">
          <a href="#" className="hover:text-blue-400 transition">
            Privacy Policy
          </a>
          <a href="#" className="hover:text-blue-400 transition">
            Terms of Service
          </a>
          <a href="#" className="hover:text-blue-400 transition">
            Contact Us
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

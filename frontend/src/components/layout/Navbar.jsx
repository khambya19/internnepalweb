import React from 'react';

const Navbar = () => {
  return (
    <nav className="bg-white shadow-lg fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0">
            <h1 className="text-3xl font-bold text-blue-600 cursor-pointer">
              InternNepal
            </h1>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <a href="#" className="text-gray-700 hover:text-blue-600 font-medium text-lg">
              Login
            </a>
            <a
              href="#"
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-3 rounded-lg text-lg transition"
            >
              Sign Up
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
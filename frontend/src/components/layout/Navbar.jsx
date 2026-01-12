import React, { useState } from 'react';
import logoAlphabet from '../../assets/images/internnepal-logo-alphabet.svg';
import { Link } from 'react-router-dom';
import { Menu, X, ChevronDown } from 'lucide-react';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // For mobile dropdown toggle

  return (
    <nav className="bg-white shadow-lg fixed top-0 left-0 right-0 z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* 1. Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <img
                src={logoAlphabet}
                alt="InternNepal Logo"
                className="w-9 h-9 md:w-10 md:h-10 drop-shadow-sm"
                style={{ marginRight: '0.25rem' }}
              />
              <span className="text-3xl font-bold text-blue-600 tracking-tight">
                InternNepal
              </span>
            </Link>
          </div>

          {/* 2. Desktop Navigation */}
          <div className="hidden md:flex items-center gap-10">
            <Link to="/" className="text-slate-500 hover:text-cyan-600 font-medium transition-all duration-200 transform hover:scale-105 active:scale-95">Home</Link>
            <Link to="/jobs" className="text-slate-500 hover:text-cyan-600 font-medium transition-all duration-200 transform hover:scale-105 active:scale-95">Find Internships</Link>
            {/* <Link to="/alerts" className="text-gray-600 hover:text-blue-600 font-medium transition">Job Alerts</Link> */}
            
            {/* DESKTOP DROPDOWN (Single Item) */}
            <div className="relative group">
              <button className="flex items-center text-slate-500 hover:text-cyan-600 font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 focus:outline-none">
                For Employers <ChevronDown size={16} className="ml-1" />
              </button>
              
              {/* Dropdown Content */}
              <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-blue-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0">
                 <div className="p-2">
                   <Link 
                     to="/post-job" 
                     className="block px-4 py-2 text-sm text-slate-500 hover:bg-blue-50 hover:text-blue-600 rounded-lg"
                   >
                     Post a Job
                   </Link>
                 </div>
              </div>
            </div>

           

            {/* Desktop Auth Buttons */}
            <div className="flex items-center gap-6 ml-8">
              <Link
                to="/login"
                className="border-2 border-cyan-600 text-cyan-600 font-semibold bg-white shadow-sm px-6 py-2 rounded-lg transition-all duration-200 transform hover:bg-cyan-600 hover:text-white hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="bg-blue-600 text-white px-8 py-2.5 rounded-lg font-semibold shadow-md transition-all duration-200 transform hover:bg-violet-600 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-violet-400"
              >
                Sign Up
              </Link>
            </div>
          </div>

          {/* 3. Mobile Hamburger Button */}
          <div className="md:hidden flex items-center">
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="text-slate-500 hover:text-blue-600 focus:outline-none p-2"
            >
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* 4. Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-blue-100 absolute w-full shadow-xl max-h-[90vh] overflow-y-auto">
          <div className="px-4 pt-2 pb-6 space-y-1">
            <Link to="/" onClick={() => setIsOpen(false)} className="block px-3 py-3 text-base font-medium text-slate-500 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95">Home</Link>
            <Link to="/jobs" onClick={() => setIsOpen(false)} className="block px-3 py-3 text-base font-medium text-slate-500 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95">Find Internships</Link>
            
            {/* MOBILE DROPDOWN (Single Item) */}
            <div>
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center justify-between w-full px-3 py-3 text-base font-medium text-slate-500 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95"
              >
                For Employers <ChevronDown size={16} className={`transform transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isDropdownOpen && (
                <div className="pl-6 space-y-1 bg-blue-50 rounded-lg mt-1 mb-1">
                  <Link 
                    to="/post-job" 
                    onClick={() => setIsOpen(false)} 
                    className="block px-3 py-2 text-sm text-slate-500 hover:text-cyan-600 transition-all duration-200 transform hover:scale-105 active:scale-95"
                  >
                    Post a Job
                  </Link>
                </div>
              )}
            </div>

            <Link to="/blog" onClick={() => setIsOpen(false)} className="block px-3 py-3 text-base font-medium text-slate-500 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95">Career Advice</Link>
            
            <div className="border-t border-blue-100 my-2 pt-4 space-y-3">
              <Link
                to="/login"
                onClick={() => setIsOpen(false)}
                className="block w-full text-center px-3 py-3 text-base font-medium border-2 border-cyan-600 text-cyan-600 bg-white rounded-lg transition-all duration-200 transform hover:bg-cyan-600 hover:text-white hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              >
                Log In
              </Link>
              <Link
                to="/register"
                onClick={() => setIsOpen(false)}
                className="block w-full text-center bg-blue-600 text-white px-3 py-3 rounded-lg font-bold shadow-md transition-all duration-200 transform hover:bg-violet-600 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-violet-400"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
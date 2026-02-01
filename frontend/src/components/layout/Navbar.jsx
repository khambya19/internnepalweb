import React, { useState, useContext } from 'react';
import { AuthContext } from '../../context/authContext';
import { Link } from 'react-router-dom';
import { Menu, X, Briefcase } from 'lucide-react';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useContext(AuthContext);

  const role = user?.role?.toLowerCase() || '';
  const path = window.location.pathname;
  const isDashboard = ['/student-dashboard', '/company/dashboard', '/superadmin', '/dashboard'].some(
    (dashboardPath) => path.startsWith(dashboardPath)
  );

  let dashboardPath = '/';
  if (role === 'student') dashboardPath = '/student-dashboard';
  else if (role === 'company') dashboardPath = '/company/dashboard';
  else if (role === 'superadmin') dashboardPath = '/superadmin/dashboard';
  else if (role === 'admin') dashboardPath = '/dashboard';

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 min-w-0 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
      <div className="mx-auto w-full max-w-7xl min-w-0 px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-2 sm:h-20">
          <div className="flex shrink-0 items-center">
            <Link to={role ? dashboardPath : '/'} className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 drop-shadow-sm md:h-10 md:w-10">
                <Briefcase className="h-5 w-5 text-white md:h-6 md:w-6" />
              </div>
              <span className="truncate text-xl font-bold tracking-tight text-blue-600 sm:text-2xl md:text-3xl">
                InternNepal
              </span>
            </Link>
          </div>

          <div className="hidden items-center gap-10 md:flex">
            {/* Removed Home, Find Internships, For Employers links */}

            <div className="ml-4 flex items-center gap-4">
              {role ? (
                <>
                  {!isDashboard && (
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                      Welcome, {role.charAt(0).toUpperCase() + role.slice(1)}
                    </span>
                  )}
                  <button
                    onClick={logout}
                    className="rounded-lg border-2 border-red-500 bg-white px-5 py-2 font-semibold text-red-500 shadow-sm transition-all duration-200 hover:bg-red-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-400 dark:bg-slate-900"
                  >
                    Log Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="rounded-lg border-2 border-cyan-600 bg-white px-6 py-2 font-semibold text-cyan-600 shadow-sm transition-all duration-200 hover:bg-cyan-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 dark:bg-slate-900"
                  >
                    Log In
                  </Link>
                  <Link
                    to="/register"
                    className="rounded-lg bg-blue-600 px-8 py-2.5 font-semibold text-white shadow-md transition-all duration-200 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="rounded-md p-2 text-slate-600 hover:text-blue-600 focus:outline-none dark:text-slate-300 dark:hover:text-blue-400"
              aria-label="Toggle mobile menu"
            >
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="absolute w-full max-h-[90vh] overflow-y-auto border-t border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900 md:hidden">
          <div className="space-y-1 px-4 pb-6 pt-2">
            {/* Removed Home, Find Internships, For Employers links from mobile menu */}
            <div className="my-2 space-y-3 border-t border-slate-200 pt-4 dark:border-slate-800">
              {role ? (
                <button
                  onClick={logout}
                  className="block w-full rounded-lg border-2 border-red-500 bg-white px-3 py-3 text-center text-base font-medium text-red-500 transition-all duration-200 hover:bg-red-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-400 dark:bg-slate-900"
                >
                  Log Out
                </button>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setIsOpen(false)}
                    className="block w-full rounded-lg border-2 border-cyan-600 bg-white px-3 py-3 text-center text-base font-medium text-cyan-600 transition-all duration-200 hover:bg-cyan-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 dark:bg-slate-900"
                  >
                    Log In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setIsOpen(false)}
                    className="block w-full rounded-lg bg-blue-600 px-3 py-3 text-center font-bold text-white shadow-md transition-all duration-200 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;

import React, { useState, useContext, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/authContext';
import NotificationDropdown from '../NotificationDropdown';
import { ConfirmModal } from '../ui/ConfirmModal';
import api from '../../services/api';
import { toast } from 'sonner';
import { 
  LayoutDashboard, 
  Search as SearchIcon, 
  FileText, 
  User,
  LogOut,
  BookmarkCheck,
  Menu,
  X,
  Settings,
  ChevronDown,
  Flag,
} from 'lucide-react';

/* ─── Sidebar ─── */
const StudentSidebar = React.memo(({ isOpen, onClose, applicationCount, savedJobsCount, onRequestLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/student-dashboard' },
    { icon: SearchIcon, label: 'Browse Jobs', path: '/student/browse-jobs' },
    { icon: FileText, label: 'My Applications', path: '/student/applications', count: applicationCount },
    { icon: BookmarkCheck, label: 'Saved Jobs', path: '/student/saved-jobs', count: savedJobsCount },
    { icon: Flag, label: 'Reported Jobs', path: '/student/reported-jobs' },
    { icon: User, label: 'My Profile', path: '/student/profile' },
    { icon: Settings, label: 'Settings', path: '/student/settings' },
  ];

  const handleNav = (path) => {
    navigate(path);
    onClose();
  };

  const handleLogout = () => {
    onRequestLogout?.();
    onClose();
  };

  return (
    <>
      {/* Mobile overlay - click to close sidebar */}
      {isOpen && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Close menu"
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 cursor-pointer"
          onClick={onClose}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Escape') onClose(); }}
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-40 flex w-64 max-w-[85vw] sm:max-w-none flex-col border-r border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800 shadow-sm transition-transform duration-300
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Brand - match company sidebar */}
        <div className="flex h-16 items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 min-w-0">
          <Link to="/student-dashboard" className="flex items-center gap-2 min-w-0" onClick={onClose}>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-sm shrink-0">
              IN
            </div>
            <span className="text-lg font-bold text-slate-800 dark:text-white truncate">
              Intern<span className="text-blue-600">Nepal</span>
            </span>
          </Link>
          <button onClick={onClose} className="lg:hidden rounded-md p-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Close menu">
            <X size={20} />
          </button>
        </div>

        {/* Navigation - match company nav style */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-1">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.label}
                  onClick={() => handleNav(item.path)}
                  className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all text-left ${
                    isActive
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 font-semibold'
                      : 'text-gray-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <item.icon size={20} className="shrink-0 text-blue-800 dark:text-blue-200" />
                  <span className="flex-1">{item.label}</span>
                  {item.count !== undefined && (
                    <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold bg-blue-600 text-white dark:bg-blue-500 dark:text-white">
                      {item.count > 99 ? '99+' : item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        <div className="border-t border-slate-200 dark:border-slate-800 p-3">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 transition-all">
            <LogOut size={20} className="shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
});

// Context for sidebar count refresh
const SidebarCountContext = React.createContext({ refreshCounts: () => {} });

/* ─── Top Navbar ─── */
const StudentTopNav = ({ user, onMenuToggle, isSidebarOpen, onRequestLogout }) => {
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 min-h-[4rem] max-h-[4rem] shrink-0 items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 sm:px-4 md:px-6 shadow-sm gap-2 flex-none min-w-0">
      {/* Left: Hamburger + Nav Links */}
      <div className="flex items-center gap-2 sm:gap-4 md:gap-6 min-w-0 flex-1">
        <button
          type="button"
          onClick={onMenuToggle}
          aria-label="Toggle menu"
          aria-expanded={isSidebarOpen}
          className="rounded-md p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden shrink-0"
        >
          <Menu size={20} aria-hidden />
        </button>

        {/* Mobile: show brand name */}
        <span className="lg:hidden font-extrabold text-xl tracking-tight text-blue-600">InternNepal</span>
      </div>

      {/* Right: Notifications, Profile */}
      <div className="flex items-center gap-1 sm:gap-2 md:gap-4 shrink-0">
        {/* Notification */}
        <NotificationDropdown
          buttonClassName="relative rounded-md p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
        />

        {/* Divider */}
        <div className="hidden sm:block w-px h-8 bg-gray-200 dark:bg-gray-700 mx-1"></div>

        {/* Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 rounded-md p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-sm overflow-hidden">
              {user?.StudentProfile?.avatar ? (
                <img src={user.StudentProfile.avatar} alt={user.name} className="h-full w-full object-cover" />
              ) : (
                <>{user?.name?.charAt(0)?.toUpperCase() || 'S'}</>
              )}
            </div>
            <div className="hidden flex-col items-start md:flex min-w-0 max-w-[140px] lg:max-w-[180px]">
              <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{user?.name || 'Student'}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{user?.role || 'Student'}</p>
            </div>
            <ChevronDown size={16} className={`hidden md:block text-slate-500 dark:text-slate-400 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown */}
          {profileOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setProfileOpen(false)}
              />
              <div className="absolute right-0 z-50 mt-2 w-56 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl">
                <div className="border-b border-slate-200 dark:border-slate-800 p-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white overflow-hidden">
                    {user?.StudentProfile?.avatar ? (
                      <img src={user.StudentProfile.avatar} alt={user.name} className="h-full w-full object-cover" />
                    ) : (
                      <>{user?.name?.charAt(0)?.toUpperCase() || 'S'}</>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 dark:text-slate-100 truncate">{user?.name || 'Student'}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email || 'student@email.com'}</p>
                  </div>
                </div>
                <div className="py-2">
                  <Link to="/student/profile" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800">
                    <User size={16} className="text-slate-500 dark:text-slate-300" />
                    My Profile
                  </Link>
                  <Link to="/student/settings" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800">
                    <Settings size={16} className="text-slate-500 dark:text-slate-300" />
                    Settings
                  </Link>
                </div>
                <div className="border-t border-slate-200 dark:border-slate-800 py-2">
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      onRequestLogout?.();
                    }}
                    className="flex items-center gap-3 px-4 py-2 w-full text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

/* ─── Layout ─── */
const StudentLayout = ({ children, user }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [applicationCount, setApplicationCount] = useState(0);
  const [savedJobsCount, setSavedJobsCount] = useState(0);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const requestLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    logout();
  };

  const refreshCounts = async () => {
    try {
      const [appsRes, savedRes] = await Promise.all([
        api.get('/applications/my-applications').catch((err) => {
          // Silently handle profile incomplete errors
          if (err?.response?.data?.code === 'PROFILE_INCOMPLETE') {
            return { data: { success: false, data: [] } };
          }
          return { data: { success: false, data: [] } };
        }),
        api.get('/student/saved-jobs').catch((err) => {
          // Silently handle profile incomplete errors
          if (err?.response?.data?.code === 'PROFILE_INCOMPLETE') {
            return { data: { success: false, data: [] } };
          }
          return { data: { success: false, data: [] } };
        })
      ]);
      if (appsRes.data?.success) {
        const nextApps = Number(appsRes.data.data.length || 0);
        setApplicationCount((prev) => (prev === nextApps ? prev : nextApps));
      }
      if (savedRes.data?.success) {
        const nextSaved = Number(savedRes.data.data.length || 0);
        setSavedJobsCount((prev) => (prev === nextSaved ? prev : nextSaved));
      }
    } catch (error) {
      // Only log unexpected errors
      if (error?.response?.data?.code !== 'PROFILE_INCOMPLETE') {
        console.error('Failed to fetch sidebar counts:', error);
      }
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      refreshCounts();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (location.state?.reason !== 'profile_incomplete') return;
    toast.warning('Complete your profile first to access that panel.');
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.pathname, location.state, navigate]);

  return (
    <SidebarCountContext.Provider value={{ refreshCounts }}>
      <div className="flex min-h-screen bg-slate-100 dark:bg-slate-950 overflow-x-hidden">
        <StudentSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          applicationCount={applicationCount}
          savedJobsCount={savedJobsCount}
          onRequestLogout={requestLogout}
        />
        <div className="flex flex-1 flex-col min-w-0 min-h-0 lg:ml-64">
          <StudentTopNav
            user={user}
            onMenuToggle={() => setSidebarOpen((prev) => !prev)}
            isSidebarOpen={sidebarOpen}
            onRequestLogout={requestLogout}
          />
          <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden bg-slate-100 dark:bg-slate-950 scroll-mt-20 min-w-0">
            <div className="container mx-auto w-full max-w-full min-w-0 px-3 pt-2 pb-4 sm:px-4 sm:pt-3 sm:pb-5 md:px-6 md:pt-4 md:pb-6 lg:px-8 lg:pt-4 lg:pb-8 text-slate-900 dark:text-gray-100">
              {children}
            </div>
          </main>
        </div>
        <ConfirmModal
          open={showLogoutConfirm}
          onClose={() => setShowLogoutConfirm(false)}
          onConfirm={confirmLogout}
          title="Logout Confirmation"
          message="Are you sure you want to logout from your student dashboard?"
          confirmLabel="Logout"
          cancelLabel="Cancel"
          variant="danger"
        />
      </div>
    </SidebarCountContext.Provider>
  );
};

export { SidebarCountContext };
export default StudentLayout;

import React, { useState, useEffect } from 'react';
import { Menu, User, Settings, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSidebarStore } from '../../stores/sidebarStore';
import { AuthContext } from '../../context/authContext';
import { useContext } from 'react';
import { toast } from 'sonner';
import NotificationDropdown from '../NotificationDropdown';
import axios from 'axios';

const Topbar = ({ onRequestLogout }) => {
  const navigate = useNavigate();
  const { toggle: toggleSidebar } = useSidebarStore();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const { user, logout } = useContext(AuthContext);
  const [companyLogo, setCompanyLogo] = useState(null);
  const [companyName, setCompanyName] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await axios.get('http://localhost:6060/api/company/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success && res.data.data) {
          setCompanyLogo(res.data.data.logo || null);
          setCompanyName(res.data.data.companyName || '');
        }
      } catch {
        // silently fail — fallback to initials
      }
    };
    fetchProfile();
  }, []);

  const getLogoSrc = (logo) => {
    if (!logo) return null;
    if (logo.startsWith('http') || logo.startsWith('data:')) return logo;
    return `/${logo}`;
  };

  const handleLogout = () => {
    setShowProfileMenu(false);
    if (onRequestLogout) {
      onRequestLogout();
      return;
    }
    toast.success('Logged out successfully.');
    logout();
  };

  const displayName = companyName || user?.name || 'Company User';
  const logoSrc = getLogoSrc(companyLogo);

  return (
    <header className="sticky top-0 z-30 flex h-16 min-h-[4rem] max-h-[4rem] shrink-0 items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 sm:px-4 md:px-6 shadow-sm gap-2 flex-none min-w-0">
      <div className="flex flex-1 items-center gap-2 sm:gap-4 min-w-0">
        <button
          onClick={toggleSidebar}
          className="rounded-md p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden shrink-0"
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </button>
        <span className="lg:hidden font-extrabold text-xl tracking-tight text-blue-600">
          InternNepal
        </span>
      </div>

      <div className="flex items-center gap-1 sm:gap-2 md:gap-4 shrink-0">
        <NotificationDropdown
          buttonClassName="relative rounded-md p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
        />

        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 rounded-md p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white overflow-hidden">
              {logoSrc ? (
                <img src={logoSrc} alt="Company Logo" className="h-full w-full object-cover rounded-full" />
              ) : (
                displayName.charAt(0).toUpperCase()
              )}
            </div>
            <div className="hidden flex-col items-start md:flex min-w-0 max-w-[120px] lg:max-w-[180px]">
              <span className="text-sm font-medium text-slate-900 dark:text-white truncate">{displayName}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">Company</span>
            </div>
          </button>

          {showProfileMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowProfileMenu(false)}
              />
              <div className="absolute right-0 z-50 mt-2 w-56 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl">
                <div className="border-b border-slate-200 dark:border-slate-800 p-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white overflow-hidden">
                    {logoSrc ? (
                      <img src={logoSrc} alt="Company Logo" className="h-full w-full object-cover rounded-full" />
                    ) : (
                      displayName.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 dark:text-slate-100 truncate">{displayName}</p>
                  </div>
                </div>
                <div className="py-2">
                  <button
                    onClick={() => {
                      navigate('/company/dashboard/profile');
                      setShowProfileMenu(false);
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <User size={16} />
                    Company Profile
                  </button>
                  <button
                    onClick={() => {
                      navigate('/company/dashboard/settings');
                      setShowProfileMenu(false);
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Settings size={16} />
                    Settings
                  </button>
                </div>
                <div className="border-t border-slate-200 dark:border-slate-800 py-2">
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900"
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

export default Topbar;

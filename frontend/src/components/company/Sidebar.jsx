import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  Inbox,
  Building2,
  Settings,
  LogOut,
  X,
  Flag,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useSidebarStore } from '../../stores/sidebarStore';
import { toast } from 'sonner';
import { AuthContext } from '../../context/authContext';

const navItems = [
  {
    name: 'Dashboard',
    icon: LayoutDashboard,
    path: '/company/dashboard',
    end: true,
  },
  {
    name: 'My Postings',
    icon: FileText,
    path: '/company/dashboard/my-listings',
  },
  {
    name: 'Post New Internship',
    icon: PlusCircle,
    path: '/company/dashboard/post-internship',
    highlight: true,
  },
  {
    name: 'Applications',
    icon: Inbox,
    path: '/company/dashboard/applications',
  },
  {
    name: 'Reported Jobs',
    icon: Flag,
    path: '/company/dashboard/reported-jobs',
  },
];

const bottomNavItems = [
  {
    name: 'Company Profile',
    icon: Building2,
    path: '/company/dashboard/profile',
  },
  {
    name: 'Settings',
    icon: Settings,
    path: '/company/dashboard/settings',
  },
];

const Sidebar = ({ onRequestLogout }) => {
  const { isOpen, close } = useSidebarStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = React.useContext(AuthContext);

  const handleLogout = () => {
    if (onRequestLogout) {
      onRequestLogout();
      return;
    }
    toast.success('Logged out successfully.');
    logout();
  };

  const isActivePath = (itemPath, end = false) => {
    if (end) return location.pathname === itemPath;
    return location.pathname === itemPath || location.pathname.startsWith(`${itemPath}/`);
  };

  const handleNavigate = (path) => {
    if (location.pathname === path) return;
    navigate(path);
  };

  return (
    <>
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 max-w-[85vw] sm:max-w-none flex-col border-r border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800 shadow-sm transition-transform duration-300',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo & Close button */}
        <div className="flex h-16 items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-sm">
              IN
            </div>
            <span className="text-lg font-bold text-slate-800 dark:text-slate-100">
              InternNepal
            </span>
          </div>
          <button
            onClick={close}
            className="lg:hidden rounded-md p-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.name}
                type="button"
                onClick={() => handleNavigate(item.path)}
                className={cn(
                  'group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all text-left',
                  isActivePath(item.path, item.end)
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 font-semibold'
                    : 'text-blue-400 dark:text-blue-300 hover:bg-slate-100 dark:hover:bg-slate-800',
                  item.highlight && !isActivePath(item.path, item.end) &&
                    'text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900'
                )}
              >
                <item.icon size={20} className="shrink-0 text-blue-800 dark:text-blue-200" />
                <span className="flex-1">{item.name}</span>
                {item.badge && (
                  <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-blue-600 px-1.5 text-xs font-bold text-white">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="my-4 border-t border-slate-200 dark:border-slate-800" />

          <div className="space-y-1">
            {bottomNavItems.map((item) => (
              <button
                key={item.name}
                type="button"
                onClick={() => handleNavigate(item.path)}
                className={cn(
                  'group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all text-left',
                  isActivePath(item.path) ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : 'text-gray-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
                )}
              >
                <item.icon size={20} className="shrink-0 text-blue-800 dark:text-blue-200" />
                <span>{item.name}</span>
              </button>
            ))}
          </div>
        </nav>

        <div className="border-t border-slate-200 dark:border-slate-800 p-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

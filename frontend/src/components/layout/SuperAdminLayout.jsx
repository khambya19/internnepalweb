import React, { useState, useContext } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  GraduationCap,
  Briefcase, 
  FileText, 
  LogOut,
  Menu,
  X,
  Shield,
  Flag
} from 'lucide-react';
import { AuthContext } from '../../context/authContext';
import { ConfirmModal } from '../ui/ConfirmModal';

const SuperAdminLayout = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const location = useLocation();
  const { logout, user } = useContext(AuthContext);

  const handleLogoutRequest = () => setShowLogoutConfirm(true);
  const handleLogoutConfirm = () => logout();

  const menuItems = [
    { path: '/superadmin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/superadmin/users', label: 'Manage Users', icon: Users },
    { path: '/superadmin/companies', label: 'Manage Companies', icon: Building2 },
    { path: '/superadmin/students', label: 'Manage Students', icon: GraduationCap },
    { path: '/superadmin/jobs', label: 'Manage Jobs', icon: Briefcase },
    { path: '/superadmin/applications', label: 'Manage Applications', icon: FileText },
    { path: '/superadmin/reports', label: 'Job Reports', icon: Flag },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex overflow-x-hidden">
      {mobileSidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-2xl transform transition-transform duration-300 ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="text-yellow-500 dark:text-yellow-400" size={26} />
            <span className="font-black text-base sm:text-lg text-gray-900 dark:text-white">Super Admin</span>
          </div>
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="lg:hidden text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Menu Items */}
        <nav className="mt-4 sm:mt-6 space-y-1 px-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-yellow-500 text-gray-900 font-bold'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Icon size={20} />
                <span className="flex-1 text-sm sm:text-base">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="absolute bottom-0 w-full p-4 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={handleLogoutRequest}
            className="flex items-center gap-3 px-4 py-3 rounded-lg w-full text-gray-700 dark:text-gray-300 hover:bg-red-600 hover:text-white transition-all"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 lg:ml-72 transition-all duration-300 overflow-x-hidden">
        {/* Top Bar */}
        <header className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-gray-800 px-3 sm:px-6 lg:px-8 py-3 sm:py-4 sticky top-0 z-30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="inline-flex items-center justify-center rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-800 lg:hidden"
                aria-label="Open menu"
              >
                <Menu size={20} />
              </button>
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white truncate">Super Admin Panel</h1>
            </div>
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <div className="hidden sm:block text-right min-w-0">
                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user?.name || 'Super Admin'}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
              </div>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-yellow-500 flex items-center justify-center font-bold text-gray-900 overflow-hidden">
                {user?.logo ? (
                  <img src={user.logo.startsWith('http') ? user.logo : `/${user.logo}`} alt="Profile" className="h-10 w-10 object-cover rounded-full" />
                ) : (
                  (user?.name || 'SA').charAt(0).toUpperCase()
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-3 sm:p-6 lg:p-8 min-w-0">
          <Outlet />
        </div>
      </main>

      <ConfirmModal
        open={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogoutConfirm}
        title="Logout Confirmation"
        message="Are you sure you want to logout from your super admin dashboard?"
        confirmLabel="Logout"
        cancelLabel="Cancel"
        variant="danger"
      />
    </div>
  );
};

export default SuperAdminLayout;

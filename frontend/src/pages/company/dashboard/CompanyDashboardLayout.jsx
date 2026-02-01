import React, { useContext, useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '../../../components/company/Sidebar';
import Topbar from '../../../components/company/Topbar';
import Breadcrumbs from '../../../components/company/Breadcrumbs';
import { useSidebarStore } from '../../../stores/sidebarStore';
import { ConfirmModal } from '../../../components/ui/ConfirmModal';
import { AuthContext } from '../../../context/authContext';
import { toast } from 'sonner';

const CompanyDashboardLayout = () => {
  const { logout } = useContext(AuthContext);
  const { isOpen: sidebarOpen, close } = useSidebarStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const requestLogout = () => setShowLogoutConfirm(true);
  const confirmLogout = () => {
    toast.success('Logged out successfully.');
    logout();
  };

  // Remove forced light theme. Theme is now handled globally in App.jsx

  // Close sidebar on route change (mobile only)
  useEffect(() => {
    if (window.innerWidth < 1024) {
      close();
    }
  }, [location.pathname, close]);

  useEffect(() => {
    if (location.state?.reason !== 'profile_incomplete') return;
    toast.warning('Complete your company profile first to access that panel.');
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.pathname, location.state, navigate]);

  return (
    <div className="flex min-h-screen bg-slate-100 dark:bg-slate-950 company-dashboard overflow-x-hidden">
      {/* Sidebar */}
      <Sidebar onRequestLogout={requestLogout} />
      
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={close}
        />
      )}

      {/* Main content area - Topbar is in flow (sticky), so no pt on main */}
      <div className="flex flex-1 flex-col min-w-0 min-h-0 lg:ml-64">
        <Topbar onRequestLogout={requestLogout} />
        
        <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden bg-slate-100 dark:bg-slate-950 scroll-mt-20 min-w-0">
          <div className="container mx-auto w-full max-w-full min-w-0 px-3 pt-2 pb-4 sm:px-4 sm:pt-3 sm:pb-5 md:px-6 md:pt-4 md:pb-6 lg:px-8 lg:pt-4 lg:pb-8">
            {/* Breadcrumbs */}
            <Breadcrumbs />
            
            {/* Page content */}
            <Outlet />
          </div>
        </main>
      </div>

      <ConfirmModal
        open={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={confirmLogout}
        title="Logout Confirmation"
        message="Are you sure you want to logout from your company dashboard?"
        confirmLabel="Logout"
        cancelLabel="Cancel"
        variant="danger"
      />
    </div>
  );
};

export default CompanyDashboardLayout;

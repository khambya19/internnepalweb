import React, { useContext } from 'react'
import { useThemeStore } from './stores/themeStore';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthContext } from './context/authContext';
import './App.css'

import Home from './pages/shared/Home'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ResetPassword from './pages/auth/ResetPassword';
import VerifyEmail from './pages/auth/VerifyEmail';
import ProtectedRoute from './components/common/ProtectedRoute';
import GuestRoute from './components/common/GuestRoute';
import StudentDashboard from './pages/student/Dashboard';
import StudentBrowseJobs from './pages/student/BrowseJobs';
import StudentApplications from './pages/student/MyApplications';
import StudentSavedJobs from './pages/student/SavedJobs';
import StudentProfile from './pages/student/Profile';
import StudentSettings from './pages/student/Settings';
import StudentReportedJobs from './pages/student/ReportedJobs';
import JobDetails from './pages/student/JobDetails';
import StudentCompanyProfile from './pages/student/CompanyProfile';
import CompanyDashboardLayout from './pages/company/dashboard/CompanyDashboardLayout';
import Overview from './pages/company/dashboard/pages/Overview';
import PostInternship from './pages/company/dashboard/pages/PostInternship';
import MyListings from './pages/company/dashboard/pages/MyListings';
import Applications from './pages/company/dashboard/pages/Applications';
import Shortlisted from './pages/company/dashboard/pages/Shortlisted';
import BrowseCandidates from './pages/company/dashboard/pages/BrowseCandidates';
import CompanyReportedJobs from './pages/company/dashboard/pages/ReportedJobs';
import CompanyProfile from './pages/company/dashboard/pages/CompanyProfile';
import Settings from './pages/company/dashboard/pages/Settings';
import SuperAdminLayout from './components/layout/SuperAdminLayout';
import SuperAdminDashboard from './pages/superadmin/Dashboard';
import ManageUsers from './pages/superadmin/ManageUsers';
import ManageCompanies from './pages/superadmin/ManageCompanies';
import ManageStudents from './pages/superadmin/ManageStudents';
import ManageJobs from './pages/superadmin/ManageJobs';
import ManageApplications from './pages/superadmin/ManageApplications';
import ManageReports from './pages/superadmin/Reports';
import EditJob from './pages/superadmin/EditJob';

function App() {
  const location = useLocation();
  const { loading } = useContext(AuthContext);
  // Theme logic: automatically sync with system theme
  const theme = useThemeStore((state) => state.theme);
  
  React.useEffect(() => {
    // Sync with system theme once on app boot.
    useThemeStore.getState().syncWithSystem();
  }, []);

  React.useEffect(() => {
    // Apply theme class to document
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Show loading screen while authentication is being verified
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-lg">
            IN
          </div>
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">Loading InternNepal...</p>
        </div>
      </div>
    );
  }


  // Only show Navbar/Footer if not on dashboard
  const dashboardPaths = ['/student-dashboard', '/student/', '/company/dashboard', '/company/', '/superadmin/'];
  const isDashboard = dashboardPaths.some(path => location.pathname.startsWith(path));
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-slate-950">
      <div className="fixed top-4 right-4 z-[99999] flex flex-col items-end gap-2" aria-live="polite">
        <Toaster position="top-right" richColors closeButton />
      </div>
      {!isDashboard && <Navbar />}
      <main className={`flex-grow ${!isDashboard ? 'pt-16 sm:pt-20' : ''}`}>
        <Routes>
          {/* Guest-only routes - redirect authenticated users */}
          <Route element={<GuestRoute />}>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/auth/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>
          <Route path="/auth/forgot-password" element={<ResetPassword />} />
          <Route path="/auth/reset-password" element={<ResetPassword />} />
          {/* Redirect old /forgot-password route to new one */}
          <Route path="/forgot-password" element={<Navigate to="/auth/forgot-password" replace />} />
          <Route path="/verify-email" element={<VerifyEmail />} />

          {/* Student Dashboard - only for students */}
          <Route
            element={
              <ProtectedRoute
                allowedRoles={['student']}
                allowIncompletePaths={['/student/profile']}
              />
            }
          >
            <Route path="/student-dashboard" element={<StudentDashboard />} />
            <Route path="/student/browse-jobs" element={<StudentBrowseJobs />} />
            <Route path="/student/applications" element={<StudentApplications />} />
            <Route path="/student/profile" element={<StudentProfile />} />
            <Route path="/student/saved-jobs" element={<StudentSavedJobs />} />
            <Route path="/student/reported-jobs" element={<StudentReportedJobs />} />
            <Route path="/student/settings" element={<StudentSettings />} />
            <Route path="/student/job/:id" element={<JobDetails />} />
            <Route path="/student/company/:companyId" element={<StudentCompanyProfile />} />
          </Route>

          {/* Company Dashboard - only for companies */}
          <Route
            element={
              <ProtectedRoute
                allowedRoles={['company']}
                allowIncompletePaths={['/company/dashboard/profile']}
              />
            }
          > 
            <Route path="/company/dashboard" element={<CompanyDashboardLayout />}>
              <Route index element={<Overview />} />
              <Route path="overview" element={<Overview />} />
              <Route path="post-internship" element={<PostInternship />} />
              <Route path="my-listings" element={<MyListings />} />
              <Route path="applications" element={<Applications />} />
              <Route path="shortlisted" element={<Shortlisted />} />
              <Route path="browse-candidates" element={<BrowseCandidates />} />
              <Route path="reported-jobs" element={<CompanyReportedJobs />} />
              <Route path="profile" element={<CompanyProfile />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Route>

          {/* Super Admin Dashboard - only for superadmins */}
          <Route element={<ProtectedRoute allowedRoles={['superadmin']} />}>
            <Route path="/superadmin" element={<SuperAdminLayout />}>
              <Route index element={<Navigate to="/superadmin/dashboard" replace />} />
              <Route path="dashboard" element={<SuperAdminDashboard />} />
              <Route path="users" element={<ManageUsers />} />
              <Route path="companies" element={<ManageCompanies />} />
              <Route path="students" element={<ManageStudents />} />
              <Route path="jobs" element={<ManageJobs />} />
              <Route path="jobs/:id/edit" element={<EditJob />} />
              <Route path="applications" element={<ManageApplications />} />
              <Route path="reports" element={<ManageReports />} />
            </Route>
          </Route>

          {/* Unauthorized page (optional) */}
          <Route path="/unauthorized" element={<div className="text-center py-20 text-2xl text-red-600 dark:text-red-400">Unauthorized</div>} />
          {/* Catch-all route for 404s */}
          <Route path="*" element={<div className="text-center py-20 text-2xl text-gray-600 dark:text-gray-400">404 - Page Not Found</div>} />
        </Routes>
      </main>
      {!isDashboard && <Footer />}
    </div>
  )
}

export default App

import React from 'react'
import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import './App.css'

import Home from './pages/shared/Home'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ResetPassword from './pages/auth/ResetPassword';
import VerifyEmail from './pages/auth/VerifyEmail';
import ProtectedRoute from './components/common/ProtectedRoute';
import StudentDashboard from './pages/student/Dashboard';
import CompanyDashboard from './pages/company/Dashboard';
import AdminDashboard from './pages/admin/Dashboard';

function App() {
  const location = useLocation();


  // Only show Navbar/Footer if not on dashboard
  const dashboardPaths = ['/student-dashboard', '/company-dashboard', '/dashboard'];
  const isDashboard = dashboardPaths.includes(location.pathname);
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {!isDashboard && <Navbar />}
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/auth/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/auth/forgot-password" element={<ResetPassword />} />
          <Route path="/auth/reset-password" element={<ResetPassword />} />
          {/* Redirect old /forgot-password route to new one */}
          <Route path="/forgot-password" element={<Navigate to="/auth/forgot-password" replace />} />
          <Route path="/verify-email" element={<VerifyEmail />} />

          {/* Student Dashboard - only for students */}
          <Route element={<ProtectedRoute allowedRoles={['student']} />}>
            <Route path="/student-dashboard" element={<StudentDashboard />} />
          </Route>

          {/* Company Dashboard - only for companies */}
          <Route element={<ProtectedRoute allowedRoles={['company']} />}>
            <Route path="/company-dashboard" element={<CompanyDashboard />} />
          </Route>

          {/* Admin Dashboard - only for admins */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/dashboard" element={<AdminDashboard />} />
          </Route>

          {/* Unauthorized page (optional) */}
          <Route path="/unauthorized" element={<div className="text-center py-20 text-2xl text-red-600">Unauthorized</div>} />
          {/* Catch-all route for 404s */}
          <Route path="*" element={<div className="text-center py-20 text-2xl text-gray-600">404 - Page Not Found</div>} />
        </Routes>
      </main>
      {!isDashboard && <Footer />}
    </div>
  )
}

export default App
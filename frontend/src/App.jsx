import React from 'react'
import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import './App.css'

import Home from './pages/shared/Home'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ResetPassword from './pages/auth/ResetPassword';

function App() {
  const location = useLocation();


  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Navbar is here, so it shows on ALL pages */}
      <Navbar />

      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
            <Route path="/auth/forgot-password" element={<ResetPassword />} />
            <Route path="/auth/reset-password" element={<ResetPassword />} />
            {/* Redirect old /forgot-password route to new one */}
            <Route path="/forgot-password" element={<Navigate to="/auth/forgot-password" replace />} />
        </Routes>
      </main>

      <Footer />
    </div>
  )
}

export default App
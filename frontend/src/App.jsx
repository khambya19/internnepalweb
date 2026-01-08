
import React from 'react'
import { Routes, Route } from 'react-router-dom'
import './App.css'

import Home from './pages/shared/Home'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'

function App() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Navbar at the top */}
      <Navbar />

      {/* Main content */}
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          {/* We'll add more routes later like /login, /register, /jobs */}
        </Routes>
      </main>

      {/* Footer at the bottom */}
      <Footer />
    </div>
  )
}

export default App
import React from 'react';
import LoginForm from '../../components/forms/LoginForm';
import loginIllustration from '../../assets/images/login-illustration.svg';
import { Link } from 'react-router-dom';

const Login = () => {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-50 via-cyan-50 to-violet-50 overflow-auto pt-20 pb-8">
      <div className="w-full md:w-[80vw] flex flex-col md:flex-row bg-white rounded-lg shadow-2xl overflow-hidden max-w-7xl mx-auto">
        {/* Left: Illustration */}
        <div className="hidden md:flex flex-col flex-1 items-center justify-center bg-black h-full p-0">
          <img src={loginIllustration} alt="Login Illustration" className="w-3/4 max-w-md" />
        </div>
        {/* Right: Form */}
        <div className="flex-1 flex flex-col justify-center px-4 py-6 md:px-16 md:py-0 h-full">
          <span className="text-2xl font-semibold text-gray-900 mb-2 tracking-tight">INTERNNEPAL</span>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-3 leading-tight">Sign in to your account</h1>
          <p className="text-gray-500 text-lg mb-8">Access jobs, internships, and career opportunities tailored for you.</p>
          <LoginForm />
        </div>
      </div>
    </div>
  );
};

export default Login;
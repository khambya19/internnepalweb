import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom'; // ← added useNavigate

const passwordRequirements =
  'Password must be at least 8 characters, include uppercase, lowercase, number, and special character.';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z
    .string()
    .min(8, passwordRequirements)
    .regex(/[A-Z]/, passwordRequirements)
    .regex(/[a-z]/, passwordRequirements)
    .regex(/[0-9]/, passwordRequirements)
    .regex(/[^A-Za-z0-9]/, passwordRequirements),
});

const LoginForm = ({ onSuccess }) => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const formFadeRef = React.useRef(null);
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
    mode: 'onTouched',
  });

  // Animation on mount
  useEffect(() => {
    if (formFadeRef.current) {
      formFadeRef.current.classList.add('fade-in-hero');
    }
  }, []);

  const onSubmit = async (formData) => {
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5050/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      let data;
      try {
        data = await response.json(); // safe even on 4xx/5xx
      } catch {
        data = {}; // if no JSON
      }

      // Check HTTP status first — most reliable
      if (!response.ok) {
        // 401, 400, 403, 500 etc.
        throw new Error(
          data.message ||
          data.error ||
          'Login failed. Please check your credentials.'
        );
      }

      // Now we know it's 2xx → must have token
      if (!data.token) {
        throw new Error('Authentication failed - no token received from server');
      }

      // Success!
      login(data.user, data.token);
      alert('Login Successful!');
      // Optional: call parent callback
      if (onSuccess) onSuccess();
      // Redirect to correct dashboard based on role
      const role = data.user.role?.toLowerCase() || '';
      if (role === 'student') {
        navigate('/student-dashboard');
      } else if (role === 'company') {
        navigate('/company-dashboard');
      } else if (role === 'admin') {
        navigate('/dashboard');
      } else {
        setError('Unknown user role.');
      }

    } catch (err) {
      // Show error in UI
      setError(err.message || 'Something went wrong. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh] py-8 px-2">
      <div ref={formFadeRef} className="w-full max-w-md">
        <form
          className="bg-white rounded-2xl shadow-2xl p-8 border border-blue-100 flex flex-col items-center"
          onSubmit={handleSubmit(onSubmit)}
        >
          {/* Brand and subtext */}
          <div className="w-full text-center mb-6">
            <span className="text-3xl font-extrabold text-blue-700 tracking-tight block mb-1">
              InternNepal
            </span>
            <p className="text-base text-gray-700 font-medium mb-1">
              Find IT internships. Grow your career.
            </p>
            <p className="text-sm text-gray-500">
              Nepal's #1 platform for students and companies to connect for real-world experience.
            </p>
          </div>

          <h2 className="text-3xl font-extrabold text-blue-600 mb-6 text-center tracking-tight">
            Sign In
          </h2>

          {/* Error Message */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4 text-center w-full">
              {error}
            </div>
          )}

          {/* Email */}
          <div className="mb-4 text-left w-full">
            <label className="block text-slate-900 text-sm font-bold mb-2" htmlFor="email">
              Email
            </label>
            <input
              className={`border border-blue-100 rounded-lg w-full py-3 px-4 text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition ${
                errors.email ? 'border-red-400' : ''
              }`}
              type="email"
              id="email"
              {...register('email')}
              placeholder="you@example.com"
            />
            {errors.email && (
              <span className="text-red-500 text-xs mt-1 block">{errors.email.message}</span>
            )}
          </div>

          {/* Password */}
          <div className="mb-2 text-left w-full relative">
            <label className="block text-slate-900 text-sm font-bold mb-2" htmlFor="password">
              Password
            </label>
            <input
              className={`border border-blue-100 rounded-lg w-full py-3 px-4 text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition pr-10 ${
                errors.password ? 'border-red-400' : ''
              }`}
              type={showPassword ? 'text' : 'password'}
              id="password"
              {...register('password')}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-9 text-slate-400 hover:text-blue-600 focus:outline-none"
              tabIndex={-1}
            >
              {showPassword ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.956 9.956 0 012.223-3.592m3.31-2.687A9.953 9.953 0 0112 5c4.477 0 8.268 2.943 9.542 7a9.956 9.956 0 01-4.043 5.306M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              )}
            </button>
            {errors.password && (
              <span className="text-red-500 text-xs mt-1 block">{errors.password.message}</span>
            )}
          </div>

          {/* Forgot Password */}
          <div className="mb-6 flex justify-between items-center w-full">
            <div></div>
            <Link
              to="/auth/forgot-password"
              className="text-cyan-600 hover:text-cyan-700 text-sm font-semibold transition"
            >
              Forgot Password?
            </Link>
          </div>

          {/* Submit Button */}
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-full w-full shadow-lg transition focus:outline-none focus:ring-2 focus:ring-blue-600 text-base disabled:opacity-50 disabled:cursor-not-allowed"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>

          {/* Sign Up & Back */}
          <div className="mt-6 text-center w-full">
            <span className="text-slate-500 text-sm">
              Don't have an account?{' '}
              <Link to="/register" className="text-cyan-600 hover:text-cyan-700 font-bold">
                Sign Up
              </Link>
            </span>
            <div className="mt-2">
              <Link to="/" className="text-xs text-slate-400 hover:text-blue-600">
                Back to Home
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;
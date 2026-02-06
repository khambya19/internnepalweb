import React, { useState, useEffect, useContext } from 'react';
import PopupMessage from '../common/PopupMessage';
import { AuthContext } from '../../context/authContext';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';

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
  const [popup, setPopup] = useState({ show: false, message: '', type: 'success' });
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

    // Add artificial 0.5s delay for loading effect
    await new Promise((resolve) => setTimeout(resolve, 500));

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const contentType = response.headers.get('content-type') || '';
      let data = {};
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        await response.text();
      }

      // Handle unverified email
      if (response.status === 403 && data.needsVerification) {
        setError(data.message);
        setPopup({ show: true, message: 'Please verify your email first!', type: 'error' });
        setTimeout(() => {
          navigate('/verify-email', { state: { email: data.email } });
        }, 1500);
        return;
      }

      if (!response.ok) {
        const fallbackMessage =
          response.status === 429
            ? 'Too many login attempts. Please wait a minute and try again.'
            : response.status === 403 && data.needsVerification
              ? 'Please verify your email before logging in.'
              : response.status >= 500
                ? 'Authentication service is unavailable. Please make sure backend is running on port 6060.'
                : 'Login failed. Please check your credentials.';
        throw new Error(
          data.message ||
          data.error ||
          fallbackMessage
        );
      }

      if (!data.token) {
        throw new Error('Authentication failed - no token received from server');
      }

      login(data.user, data.token);
      setPopup({ show: true, message: 'Login Successful!', type: 'success' });
      if (onSuccess) onSuccess();
      // Redirect after short popup
      setTimeout(() => {
        setPopup({ show: false, message: '', type: 'success' });
        const role = data.user.role?.toLowerCase() || '';
        const isProfileComplete = data.user?.profileCompletion?.completed !== false;
        if (role === 'student') {
          navigate(isProfileComplete ? '/student-dashboard' : '/student/profile');
        } else if (role === 'company') {
          navigate(isProfileComplete ? '/company/dashboard' : '/company/dashboard/profile');
        } else if (role === 'superadmin') {
          navigate('/superadmin/dashboard');
        } else if (role === 'admin') {
          navigate('/dashboard');
        } else {
          setError('Unknown user role.');
        }
      }, 1200);

    } catch (err) {
      const message = err.message || 'Something went wrong. Please try again.';
      setError(message);
      setPopup({ show: true, message, type: 'error' });
      setTimeout(() => setPopup({ show: false, message: '', type: 'error' }), 2000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {popup.show && (
        <PopupMessage
          message={popup.message}
          type={popup.type}
          onClose={() => setPopup({ show: false, message: '', type: 'success' })}
        />
      )}
      <div className="flex min-h-[60vh] items-center justify-center px-2 py-8">
        <div ref={formFadeRef} className="w-full max-w-md">
          <form
            className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-8 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
            onSubmit={handleSubmit(onSubmit)}
          >
            {/* Brand and subtext */}
            <div className="w-full text-center mb-6">
              <span className="mb-1 block text-3xl font-extrabold tracking-tight text-blue-700 dark:text-blue-400">
                InternNepal
              </span>
              <p className="mb-1 text-base font-medium text-gray-700 dark:text-slate-200">
                Find IT internships. Grow your career.
              </p>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Nepal's #1 platform for students and companies to connect for real-world experience.
              </p>
            </div>

            <h2 className="mb-6 text-center text-3xl font-extrabold tracking-tight text-blue-600 dark:text-blue-400">
              Sign In
            </h2>

            {/* Error Message */}
            {error && (
              <div className="mb-4 w-full rounded border border-red-300 bg-red-100 px-4 py-2 text-center text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
                {error}
              </div>
            )}

            {/* Email */}
            <div className="mb-4 text-left w-full">
              <label className="mb-2 block text-sm font-bold text-slate-900 dark:text-white" htmlFor="email">
                Email
              </label>
              <div className="relative">
                <Mail size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <input
                  className={`w-full rounded-lg border border-slate-300 bg-slate-50 py-3 pl-10 pr-4 text-slate-900 transition placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:bg-slate-900 ${
                    errors.email ? 'border-red-400' : ''
                  }`}
                  type="email"
                  id="email"
                  {...register('email')}
                  placeholder="you@example.com"
                />
              </div>
              {errors.email && (
                <span className="text-red-500 text-xs mt-1 block">{errors.email.message}</span>
              )}
            </div>

            {/* Password */}
            <div className="mb-2 text-left w-full relative">
              <label className="mb-2 block text-sm font-bold text-slate-900 dark:text-white" htmlFor="password">
                Password
              </label>
              <Lock size={16} className="pointer-events-none absolute left-3 top-[46px] -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input
                className={`w-full rounded-lg border border-slate-300 bg-slate-50 py-3 pl-10 pr-10 text-slate-900 transition placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:bg-slate-900 ${
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
                className="absolute right-3 top-9 text-slate-400 hover:text-blue-600 focus:outline-none dark:text-slate-500 dark:hover:text-blue-400"
                tabIndex={-1}
              >
                {showPassword ? (
                  <Eye size={20} />
                ) : (
                  <EyeOff size={20} />
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
                className="text-sm font-semibold text-cyan-600 transition hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300"
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
              <span className="text-sm text-slate-500 dark:text-slate-300">
                Don't have an account?{' '}
                <Link to="/register" className="font-bold text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300">
                  Sign Up
                </Link>
              </span>
              <div className="mt-2">
                <Link to="/" className="text-xs text-slate-400 hover:text-blue-600 dark:text-slate-500 dark:hover:text-blue-400">
                  Back to Home
                </Link>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default LoginForm;

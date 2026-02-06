import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const VerifyEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Get email from query params, location state, or sessionStorage
  const emailFromState = location.state?.email || new URLSearchParams(location.search).get('email');
  const emailFromStorage = sessionStorage.getItem('verifyEmail');
  const email = emailFromState || emailFromStorage || '';

  // Store email in sessionStorage if available
  useEffect(() => {
    if (emailFromState) {
      sessionStorage.setItem('verifyEmail', emailFromState);
    }
  }, [emailFromState]);

  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpExpiry, setOtpExpiry] = useState(Date.now() + 10 * 60 * 1000); // 10 min from mount
  const [resendCooldown, setResendCooldown] = useState(30); // 30s cooldown
  const timerRef = useRef();

  // Check if email is available
  useEffect(() => {
    if (!email || email.trim() === '') {
      setError('Email not found. Please register or login first.');
    }
  }, [email]);

  // Countdown for OTP expiry and resend cooldown
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setOtpExpiry((prev) => prev);
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  // Calculate time left for OTP expiry
  const getOtpTimeLeft = () => {
    const ms = otpExpiry - Date.now();
    if (ms <= 0) return '00:00';
    const min = Math.floor(ms / 60000);
    const sec = Math.floor((ms % 60000) / 1000);
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  // Resend OTP handler
  const handleResend = async () => {
    if (!email || email.trim() === '') {
      setError('Email not found. Please go back and register again.');
      return;
    }
    
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/resend-otp', { email });
      if (res.data.success) {
        setSuccess('OTP resent! Check your email.');
        setOtp('');
        setOtpExpiry(Date.now() + 10 * 60 * 1000); // reset expiry
        setResendCooldown(30); // reset cooldown
      } else {
        setError(res.data.message || 'Failed to resend OTP');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Server error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    
    if (!email || email.trim() === '') {
      setError('Email not found. Please go back and register again.');
      return;
    }
    
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/verify-otp', { email, otp });
      if (res.data.success) {
        setSuccess('Account verified! You can now log in.');
        sessionStorage.removeItem('verifyEmail'); // Clear stored email
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError(res.data.message || 'Verification failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Server error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-cyan-50 to-violet-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950 py-8">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-8 border border-blue-100 dark:border-slate-800 flex flex-col items-center">
        <h2 className="text-3xl font-extrabold text-blue-600 dark:text-blue-400 mb-6 text-center tracking-tight">Verify Your Email</h2>
        {email && email.trim() !== '' ? (
          <p className="text-gray-700 dark:text-slate-300 mb-4 text-center">
            Enter the OTP sent to <span className="font-semibold text-blue-600 dark:text-blue-400">{email}</span>
          </p>
        ) : (
          <p className="text-red-600 dark:text-red-400 mb-4 text-center text-sm">
            No email found. Please register or login first.
          </p>
        )}
        <form onSubmit={handleVerify} className="w-full flex flex-col gap-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-gray-500 dark:text-slate-400">OTP expires in <span className="font-semibold text-red-600 dark:text-red-400">{getOtpTimeLeft()}</span></span>
            <button
              type="button"
              className={`text-xs font-semibold ${resendCooldown > 0 ? 'text-gray-400 dark:text-slate-600 cursor-not-allowed' : 'text-blue-600 dark:text-blue-400 hover:underline'}`}
              onClick={handleResend}
              disabled={resendCooldown > 0 || loading}
            >
              Resend OTP{resendCooldown > 0 ? ` (${resendCooldown}s)` : ''}
            </button>
          </div>
          <input
            type="text"
            maxLength={6}
            value={otp}
            onChange={e => setOtp(e.target.value)}
            className="border border-blue-100 dark:border-slate-700 rounded-lg w-full py-3 px-4 text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-700 text-center text-lg tracking-widest"
            placeholder="Enter OTP"
            required
          />
          {error && <div className="text-red-600 dark:text-red-400 text-base text-center">{error}</div>}
          {success && <div className="text-green-600 dark:text-green-400 text-base text-center">{success}</div>}
          <button
            type="submit"
            className="bg-blue-600 dark:bg-blue-500 text-white font-bold py-3 px-4 rounded-full w-full shadow-lg transition focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-400 text-base hover:bg-violet-600 dark:hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? 'Verifying...' : 'Verify'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default VerifyEmail;

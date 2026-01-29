import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const VerifyEmail = () => {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpExpiry, setOtpExpiry] = useState(Date.now() + 10 * 60 * 1000); // 10 min from mount
  const [resendCooldown, setResendCooldown] = useState(30); // 30s cooldown
  const timerRef = useRef();
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
  const navigate = useNavigate();
  const location = useLocation();

  // Get email from query params or location state
  const email = location.state?.email || new URLSearchParams(location.search).get('email') || '';

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/verify-otp', { email, otp });
      if (res.data.success) {
        setSuccess('Account verified! You can now log in.');
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-cyan-50 to-violet-50 py-8">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 border border-blue-100 flex flex-col items-center">
        <h2 className="text-3xl font-extrabold text-blue-600 mb-6 text-center tracking-tight">Verify Your Email</h2>
        <p className="text-gray-700 mb-4 text-center">Enter the OTP sent to <span className="font-semibold">{email}</span></p>
        <form onSubmit={handleVerify} className="w-full flex flex-col gap-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-gray-500">OTP expires in <span className="font-semibold">{getOtpTimeLeft()}</span></span>
            <button
              type="button"
              className={`text-xs font-semibold ${resendCooldown > 0 ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:underline'}`}
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
            className="border border-blue-100 rounded-lg w-full py-3 px-4 text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white text-center text-lg tracking-widest"
            placeholder="Enter OTP"
            required
          />
          {error && <div className="text-red-600 text-base text-center">{error}</div>}
          {success && <div className="text-green-600 text-base text-center">{success}</div>}
          <button
            type="submit"
            className="bg-blue-600 text-white font-bold py-3 px-4 rounded-full w-full shadow-lg transition focus:outline-none focus:ring-2 focus:ring-blue-600 text-base hover:bg-violet-600"
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


import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import loginIllustration from "../../assets/images/login-illustration.svg";
import { useLocation, useNavigate, Link } from "react-router-dom";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const ResetPassword = () => {
  const query = useQuery();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [emailFocus, setEmailFocus] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // If token and email are present in query, show reset form, else show request form
  const emailQuery = query.get("email") || "";
  const token = query.get("token") || "";

  // Password reset request (send email)
  const handleRequest = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      // Try to send reset link; backend will respond with 404 if email not found
      const res = await axios.post(`/api/auth/request-password-reset`, { email });
      setMessage(res.data.message || "Check your email for reset instructions.");
    } catch (err) {
      if (err.response && err.response.status === 404) {
        setError("No account found with this email.");
      } else {
        setError(err.response?.data?.message || "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Password reset (set new password)
  const handleReset = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!newPassword || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`/api/auth/reset-password`, {
        email: emailQuery,
        token,
        newPassword,
      });
      setMessage(res.data.message || "Password reset successful.");
      setTimeout(() => navigate("/auth/login"), 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Animation for fade-in (like login)
  const formFadeRef = useRef(null);
  useEffect(() => {
    if (formFadeRef.current) {
      formFadeRef.current.classList.add('fade-in-hero');
    }
  }, []);

  // UI
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-cyan-50 to-violet-50 py-8">
      <div ref={formFadeRef} className="w-full max-w-4xl min-h-[520px] flex flex-col md:flex-row bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Left: Illustration */}
        <div className="hidden md:flex flex-col flex-1 items-center justify-center bg-blue-600 h-full p-0">
          <img src={loginIllustration} alt="Forgot Password Illustration" className="w-[90%] max-w-2xl drop-shadow-xl" style={{ minWidth: '320px', minHeight: '320px' }} />
        </div>
        {/* Right: Form */}
        <div className="flex-1 flex flex-col justify-center px-12 py-16 md:px-20 md:py-0 h-full">
          <span className="text-3xl font-bold text-blue-700 mb-4 tracking-tight">INTERNNEPAL</span>
          {emailQuery && token ? (
            <>
              <h2 className="text-4xl font-extrabold text-gray-900 mb-5 leading-tight">Reset your password</h2>
              <p className="text-gray-500 text-lg mb-10">Enter your new password below.</p>
              <form onSubmit={handleReset} className="space-y-6 w-full max-w-lg">
                <div>
                  <label htmlFor="newPassword" className="block text-base font-semibold mb-2">
                    New Password
                  </label>
                  <input
                    id="newPassword"
                    type="password"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="block text-base font-semibold mb-2">
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                {error && <div className="text-red-600 text-base">{error}</div>}
                {message && <div className="text-green-600 text-base">{message}</div>}
                <button
                  type="submit"
                  className={`w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white py-3 text-lg rounded-lg hover:from-indigo-700 hover:to-violet-700 focus:ring-2 focus:ring-violet-300 transition font-semibold shadow disabled:opacity-70 disabled:cursor-not-allowed`}
                  disabled={loading}
                >
                  {loading && (
                    <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                    </svg>
                  )}
                  {loading ? "Resetting..." : "Reset Password"}
                </button>
                <div className="text-center mt-6">
                  <Link
                    to="/login"
                    className="inline-block border-2 border-cyan-600 text-cyan-600 font-semibold bg-white shadow-sm px-6 py-2 rounded-lg transition-all duration-200 transform hover:bg-cyan-600 hover:text-white hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-cyan-400 text-base"
                  >
                    Back to Login
                  </Link>
                </div>
              </form>
            </>
          ) : (
            <>
              <h2 className="text-4xl font-extrabold text-gray-900 mb-5 leading-tight">Forgot your password?</h2>
              <p className="text-gray-500 text-lg mb-10">Enter your email and we'll send you a link to reset your password.</p>
              <form onSubmit={handleRequest} className="space-y-6 w-full max-w-lg">
                <div>
                  <label htmlFor="email" className="block text-base font-semibold mb-2">
                    Email Address
                  </label>
                  <div className="relative w-full">
                    <span className={`absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors duration-200 ${emailFocus ? 'text-blue-600' : 'text-blue-400'}`}>
                      {/* Envelope icon */}
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8m-18 8V8a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg>
                    </span>
                    <input
                      id="email"
                      type="email"
                      className={`w-full border ${emailFocus ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300'} rounded-lg pl-12 pr-3 py-3 text-lg focus:outline-none transition-all duration-200`}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setEmailFocus(true)}
                      onBlur={() => setEmailFocus(false)}
                      required
                      autoFocus
                      placeholder="you@example.com"
                    />
                  </div>
                </div>
                {error && <div className="text-red-600 text-base">{error}</div>}
                {message && <div className="text-green-600 text-base">{message}</div>}
                <button
                  type="submit"
                  className={`w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white py-3 text-lg rounded-lg hover:from-indigo-700 hover:to-violet-700 focus:ring-2 focus:ring-violet-300 transition font-semibold shadow disabled:opacity-70 disabled:cursor-not-allowed`}
                  disabled={loading}
                >
                  {loading && (
                    <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                    </svg>
                  )}
                  {loading ? "Sending..." : "Send Reset Link"}
                </button>
                <div className="text-center mt-6">
                  <Link
                    to="/login"
                    className="text-base font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent transition-all duration-200 hover:underline hover:underline-offset-4"
                  >
                    Back to Login
                  </Link>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;

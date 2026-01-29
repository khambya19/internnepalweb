import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { z } from "zod";
import loginIllustration from "../../assets/images/login-illustration.svg";
import { useLocation, useNavigate, Link } from "react-router-dom";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const ResetPassword = () => {
  const query = useQuery();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [step, setStep] = useState("request"); // 'request' | 'otp' | 'reset'

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [passwordValid, setPasswordValid] = useState(false);

  const formFadeRef = useRef(null);

  // ────────────────────────────────────────────────
  //  Zod schema - strict: 8+ chars + all 4 categories
  // ────────────────────────────────────────────────
  const passwordRequirements =
    "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.";

  const passwordSchema = z
    .object({
      newPassword: z
        .string()
        .min(8, passwordRequirements)
        .regex(/[A-Z]/, passwordRequirements)
        .regex(/[a-z]/, passwordRequirements)
        .regex(/[0-9]/, passwordRequirements)
        .regex(/[^A-Za-z0-9]/, passwordRequirements),
      confirmPassword: z.string(),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: "Passwords do not match.",
      path: ["confirmPassword"],
    });

  // ────────────────────────────────────────────────
  //  Real-time password strength check (UI only)
  //  Matches backend/Zod rule: must have ALL 4 categories + length
  // ────────────────────────────────────────────────
  useEffect(() => {
    const hasLength = newPassword.length >= 8;
    const hasLower = /[a-z]/.test(newPassword);
    const hasUpper = /[A-Z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);

    setPasswordValid(hasLength && hasLower && hasUpper && hasNumber && hasSpecial);
  }, [newPassword]);

  // Fade-in animation
  useEffect(() => {
    if (formFadeRef.current) {
      formFadeRef.current.classList.add("fade-in-hero");
    }
  }, []);

  // ────────────────────────────────────────────────
  //  Handlers
  // ────────────────────────────────────────────────
  const handleRequest = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await axios.post("/api/auth/request-password-reset", { email });
      setMessage(res.data.message || "OTP sent to your email.");
      setStep("otp");
    } catch (err) {
      if (err.response?.status === 404) {
        setError("No account found with this email.");
      } else {
        setError(err.response?.data?.message || "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!otp.trim()) {
      setError("Please enter the OTP.");
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post("/api/auth/verify-reset-otp", { email, otp });
      if (res.data.success) {
        setMessage("OTP verified. Please enter your new password.");
        setStep("reset");
      } else {
        setError(res.data.message || "Invalid OTP.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Invalid or expired OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    const result = passwordSchema.safeParse({ newPassword, confirmPassword });

    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post("/api/auth/reset-password", {
        email,
        otp,
        newPassword,
      });

      setMessage(res.data.message || "Password reset successful.");
      setTimeout(() => {
        navigate("/login", { state: { success: "Password reset successful. Please log in." } });
      }, 1800);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ────────────────────────────────────────────────
  //  Render
  // ────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-8">
      <div className="w-full max-w-6xl flex items-center justify-center gap-12">
        {/* Illustration - hidden on mobile */}
        <div className="hidden lg:flex flex-col items-center justify-center flex-1">
          <img
            src={loginIllustration}
            alt="Reset Password Illustration"
            className="w-full max-w-md fade-in-hero"
          />
        </div>

        {/* Form area */}
        <div ref={formFadeRef} className="flex-1 flex flex-col items-center justify-center">
          {step === "request" && (
            <>
              <h2 className="text-4xl font-extrabold text-gray-900 mb-5 leading-tight">
                Reset Password
              </h2>
              <p className="text-gray-500 text-lg mb-10">Enter your email to receive an OTP</p>

              <form onSubmit={handleRequest} className="space-y-6 w-full max-w-lg">
                <div>
                  <label htmlFor="email" className="block text-base font-semibold mb-2">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                {error && <div className="text-red-600 text-base">{error}</div>}
                {message && <div className="text-green-600 text-base">{message}</div>}

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold py-3 text-lg rounded-lg shadow-md transition-all duration-200 hover:bg-violet-600 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-violet-400 disabled:opacity-70 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  {loading && (
                    <svg
                      className="animate-spin h-6 w-6 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      />
                    </svg>
                  )}
                  {loading ? "Sending..." : "Send OTP"}
                </button>

                <div className="text-center mt-6">
                  <Link
                    to="/login"
                    className="text-blue-600 hover:text-blue-700 text-sm font-semibold transition underline underline-offset-2"
                  >
                    Back to Login
                  </Link>
                </div>
              </form>
            </>
          )}

          {step === "otp" && (
            <>
              <h2 className="text-4xl font-extrabold text-gray-900 mb-5 leading-tight">
                Verify OTP
              </h2>
              <p className="text-gray-500 text-lg mb-10">Enter the OTP sent to your email.</p>

              <form onSubmit={handleVerifyOtp} className="space-y-6 w-full max-w-lg">
                <div>
                  <label htmlFor="otp" className="block text-base font-semibold mb-2">
                    OTP
                  </label>
                  <input
                    id="otp"
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.trim())}
                    required
                  />
                </div>

                {error && <div className="text-red-600 text-base">{error}</div>}
                {message && <div className="text-green-600 text-base">{message}</div>}

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white py-3 text-lg rounded-lg hover:from-indigo-700 hover:to-violet-700 focus:ring-2 focus:ring-violet-300 transition font-semibold shadow disabled:opacity-70 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  {loading ? "Verifying..." : "Verify OTP"}
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
          )}

          {step === "reset" && (
            <>
              <h2 className="text-4xl font-extrabold text-gray-900 mb-5 leading-tight">
                Reset your password
              </h2>
              <p className="text-gray-500 text-lg mb-10">Enter your new password below.</p>

              <form onSubmit={handleReset} className="space-y-6 w-full max-w-lg">
                <div>
                  <label htmlFor="newPassword" className="block text-base font-semibold mb-2">
                    New Password
                  </label>
                  <div className="relative w-full">
                    <input
                      id="newPassword"
                      type={showPassword ? "text" : "password"}
                      className={`w-full border rounded-lg px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        passwordValid
                          ? "border-green-500 bg-green-50"
                          : newPassword && !passwordValid
                          ? "border-yellow-500 bg-yellow-50"
                          : "border-gray-300"
                      }`}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                    <span
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-gray-500 hover:text-gray-700"
                      onClick={() => setShowPassword((v) => !v)}
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        // Eye off (hide)
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10a9.96 9.96 0 012.928-7.072m1.414 1.414A7.963 7.963 0 0012 5c4.418 0 8 3.582 8 8 0 1.657-.507 3.197-1.378 4.472M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-.274.832-.642 1.617-1.1 2.336M15.536 15.536A5.978 5.978 0 0112 17c-1.657 0-3.197-.507-4.472-1.378"
                          />
                        </svg>
                      ) : (
                        // Eye (show)
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6"
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
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-.274.832-.642 1.617-1.1 2.336M15.536 15.536A5.978 5.978 0 0112 17c-1.657 0-3.197-.507-4.472-1.378"
                          />
                        </svg>
                      )}
                    </span>
                  </div>

                  {/* Checklist */}
                  <ul className="mt-3 text-sm space-y-1.5">
                    <li className={`flex items-center gap-2 ${!newPassword ? 'text-gray-400' : newPassword.length >= 8 ? 'text-green-600' : 'text-red-500'}`}>8+ characters</li>
                    <li className={`flex items-center gap-2 ${!newPassword ? 'text-gray-400' : /[a-z]/.test(newPassword) ? 'text-green-600' : 'text-red-500'}`}>Lowercase letter</li>
                    <li className={`flex items-center gap-2 ${!newPassword ? 'text-gray-400' : /[A-Z]/.test(newPassword) ? 'text-green-600' : 'text-red-500'}`}>Uppercase letter</li>
                    <li className={`flex items-center gap-2 ${!newPassword ? 'text-gray-400' : /[0-9]/.test(newPassword) ? 'text-green-600' : 'text-red-500'}`}>Number</li>
                    <li className={`flex items-center gap-2 ${!newPassword ? 'text-gray-400' : /[^A-Za-z0-9]/.test(newPassword) ? 'text-green-600' : 'text-red-500'}`}>Special character</li>
                  </ul>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-base font-semibold mb-2">
                    Confirm Password
                  </label>
                  <div className="relative w-full">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                    <span
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-gray-500 hover:text-gray-700"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      title={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10a9.96 9.96 0 012.928-7.072m1.414 1.414A7.963 7.963 0 0012 5c4.418 0 8 3.582 8 8 0 1.657-.507 3.197-1.378 4.472M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-.274.832-.642 1.617-1.1 2.336M15.536 15.536A5.978 5.978 0 0112 17c-1.657 0-3.197-.507-4.472-1.378"
                          />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6"
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
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-.274.832-.642 1.617-1.1 2.336M15.536 15.536A5.978 5.978 0 0112 17c-1.657 0-3.197-.507-4.472-1.378"
                          />
                        </svg>
                      )}
                    </span>
                  </div>
                </div>

                {error && <div className="text-red-600 text-base">{error}</div>}
                {message && <div className="text-green-600 text-base">{message}</div>}

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white py-3 text-lg rounded-lg hover:from-indigo-700 hover:to-violet-700 focus:ring-2 focus:ring-violet-300 transition font-semibold shadow disabled:opacity-70 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  {loading && (
                    <svg
                      className="animate-spin h-6 w-6 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      />
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
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
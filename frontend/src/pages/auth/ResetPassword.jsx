import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Mail,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import api from "../../services/api";

const passwordRequirements =
  "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.";

const emailSchema = z.string().trim().email("Enter a valid email address.");

const otpSchema = z
  .string()
  .trim()
  .regex(/^[0-9]{6}$/, "OTP must be exactly 6 digits.");

const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, passwordRequirements)
      .regex(/[A-Z]/, passwordRequirements)
      .regex(/[a-z]/, passwordRequirements)
      .regex(/[0-9]/, passwordRequirements)
      .regex(/[^A-Za-z0-9]/, passwordRequirements),
    confirmPassword: z.string().min(1, "Please confirm your password."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

const initialChecks = {
  length: false,
  lower: false,
  upper: false,
  number: false,
  special: false,
};

const ResetPassword = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState("request");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (resendCooldown <= 0) return undefined;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const passwordChecks = useMemo(() => {
    if (!newPassword) return initialChecks;
    return {
      length: newPassword.length >= 8,
      lower: /[a-z]/.test(newPassword),
      upper: /[A-Z]/.test(newPassword),
      number: /[0-9]/.test(newPassword),
      special: /[^A-Za-z0-9]/.test(newPassword),
    };
  }, [newPassword]);

  const clearFeedback = () => {
    setMessage("");
    setError("");
  };

  const handleRequestOtp = async (event) => {
    event.preventDefault();
    clearFeedback();

    const normalizedEmail = email.trim().toLowerCase();
    const parsedEmail = emailSchema.safeParse(normalizedEmail);
    if (!parsedEmail.success) {
      setError(parsedEmail.error.errors[0].message);
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/request-password-reset", {
        email: parsedEmail.data,
      });

      setEmail(parsedEmail.data);
      setStep("otp");
      setResendCooldown(30);
      setMessage(res.data?.message || "OTP sent to your email.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (event) => {
    event.preventDefault();
    clearFeedback();

    const parsedOtp = otpSchema.safeParse(otp);
    if (!parsedOtp.success) {
      setError(parsedOtp.error.errors[0].message);
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/verify-reset-otp", {
        email,
        otp: parsedOtp.data,
      });

      if (!res.data?.success || !res.data?.resetToken) {
        setError("OTP verification failed. Please try again.");
        return;
      }

      setResetToken(res.data.resetToken);
      setStep("reset");
      setMessage(res.data.message || "OTP verified. You can now reset your password.");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid or expired OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (loading || resendCooldown > 0) return;

    clearFeedback();
    setLoading(true);
    try {
      const res = await api.post("/auth/request-password-reset", { email });
      setResendCooldown(30);
      setMessage(res.data?.message || "A new OTP has been sent to your email.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to resend OTP right now.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    clearFeedback();

    if (!resetToken) {
      setError("OTP verification is required before resetting your password.");
      setStep("otp");
      return;
    }

    const parsedPassword = resetPasswordSchema.safeParse({
      newPassword,
      confirmPassword,
    });

    if (!parsedPassword.success) {
      setError(parsedPassword.error.errors[0].message);
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/reset-password", {
        resetToken,
        newPassword: parsedPassword.data.newPassword,
        confirmPassword: parsedPassword.data.confirmPassword,
      });

      setMessage(res.data?.message || "Password reset successful.");

      setTimeout(() => {
        navigate("/login", {
          state: { success: "Password reset successful. Please log in." },
        });
      }, 1200);
    } catch (err) {
      const responseMessage = err.response?.data?.message || "Unable to reset password.";
      setError(responseMessage);
      if (responseMessage.toLowerCase().includes("session") || responseMessage.toLowerCase().includes("otp")) {
        setStep("otp");
      }
    } finally {
      setLoading(false);
    }
  };

  const stepIndex = step === "request" ? 1 : step === "otp" ? 2 : 3;

  return (
    <div className="flex min-h-screen w-full items-center justify-center overflow-auto bg-gradient-to-br from-slate-100 via-blue-50 to-cyan-100 px-4 pb-8 pt-20 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950">
      <div className="mx-auto flex w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 md:flex-row">
        <aside className="hidden w-full max-w-md flex-col justify-between bg-gradient-to-br from-slate-900 to-blue-950 p-8 md:flex">
          <div>
            <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/20">
              <KeyRound className="h-8 w-8 text-blue-400" />
            </div>
            <h1 className="text-3xl font-extrabold text-white">Secure Password Recovery</h1>
            <p className="mt-3 text-sm text-slate-300">
              Verify your email with OTP, then reset your password safely.
            </p>
          </div>

          <div className="space-y-3 rounded-xl border border-slate-700/70 bg-slate-900/60 p-4">
            <div className="flex items-center gap-2 text-sm text-slate-200">
              <Mail size={16} className="text-cyan-400" />
              OTP delivered to your registered email
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-200">
              <Clock3 size={16} className="text-blue-400" />
              OTP expires in 10 minutes
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-200">
              <ShieldCheck size={16} className="text-emerald-400" />
              Reset only after OTP verification
            </div>
          </div>
        </aside>

        <main className="flex w-full flex-1 flex-col justify-center px-5 py-8 sm:px-10 md:px-14">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">InternNepal</p>
          <h2 className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white sm:text-4xl">
            Forgot Password
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Complete all steps to securely reset your account password.
          </p>

          <div className="mt-6 flex items-center gap-2">
            {[1, 2, 3].map((index) => (
              <div
                key={index}
                className={`h-2 w-16 rounded-full ${
                  index <= stepIndex ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-700"
                }`}
              />
            ))}
          </div>

          <div className="mt-6">
            {error && (
              <div className="mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                {error}
              </div>
            )}
            {message && (
              <div className="mb-4 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
                {message}
              </div>
            )}

            {step === "request" && (
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div>
                  <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-800 dark:text-slate-100">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full rounded-lg border border-slate-300 bg-slate-50 py-3 pl-10 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      autoComplete="email"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {loading ? "Sending OTP..." : "Send OTP"}
                </button>
              </form>
            )}

            {step === "otp" && (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label htmlFor="otp" className="mb-2 block text-sm font-semibold text-slate-800 dark:text-slate-100">
                    Enter OTP
                  </label>
                  <input
                    id="otp"
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="6-digit code"
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                  />
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {loading ? "Verifying..." : "Verify OTP"}
                  </button>

                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={loading || resendCooldown > 0}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend OTP"}
                  </button>
                </div>
              </form>
            )}

            {step === "reset" && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label
                    htmlFor="newPassword"
                    className="mb-2 block text-sm font-semibold text-slate-800 dark:text-slate-100"
                  >
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      id="newPassword"
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Create a strong password"
                      className="w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-3 pr-11 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-blue-600"
                    >
                      {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="mb-2 block text-sm font-semibold text-slate-800 dark:text-slate-100"
                  >
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your new password"
                      className="w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-3 pr-11 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-blue-600"
                    >
                      {showConfirmPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-700 dark:bg-slate-800/50">
                  {[
                    { label: "At least 8 characters", ok: passwordChecks.length },
                    { label: "Lowercase letter", ok: passwordChecks.lower },
                    { label: "Uppercase letter", ok: passwordChecks.upper },
                    { label: "Number", ok: passwordChecks.number },
                    { label: "Special character", ok: passwordChecks.special },
                  ].map((item) => (
                    <p
                      key={item.label}
                      className={`mb-1 inline-flex items-center gap-2 ${
                        item.ok
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      <CheckCircle2 size={14} />
                      {item.label}
                    </p>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {loading ? "Resetting..." : "Reset Password"}
                </button>
              </form>
            )}
          </div>

          <div className="mt-6">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 transition hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              <ArrowLeft size={14} />
              Back to Login
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ResetPassword;

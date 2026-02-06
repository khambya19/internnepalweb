const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
  login,
  register,
  requestPasswordReset,
  resetPassword,
  verifyOtp,
  resendOtp,
  verifyResetOtp,
  changePassword,
  getMe,
  logout,
  deleteAccount,
} = require("../controllers/authController");

const authAttemptLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 10 : 1000, // 10 in production, relaxed for local development
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many attempts. Please try again later." },
});

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 5 : 300, // 5 in production, relaxed for local development
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many OTP attempts. Please try again later." },
});

// ── Public Routes (No token needed) ───────────────────────
router.post("/register", authAttemptLimiter, register);
router.post("/login", authAttemptLimiter, login);
router.post("/verify-otp", otpLimiter, verifyOtp);
router.post("/resend-otp", otpLimiter, resendOtp);
router.post("/verify-reset-otp", otpLimiter, verifyResetOtp);
router.post("/request-password-reset", otpLimiter, requestPasswordReset);
router.post("/reset-password", otpLimiter, resetPassword);

// ── Protected Routes (Token required) ────────────────────
router.get("/me", protect, getMe);
router.delete("/me", protect, deleteAccount);
router.post("/change-password", protect, authAttemptLimiter, changePassword);
router.post("/logout", protect, logout);

module.exports = router;

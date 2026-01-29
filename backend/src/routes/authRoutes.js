const express = require("express");
const router = express.Router();
const { login, register, requestPasswordReset, resetPassword, verifyOtp, resendOtp, verifyResetOtp } = require("../controllers/authController");
// Route: http://localhost:5050/api/auth/verify-reset-otp
router.post("/verify-reset-otp", verifyResetOtp);
// Route: http://localhost:5050/api/auth/resend-otp
router.post("/resend-otp", resendOtp);

// Route: http://localhost:5050/api/auth/register
router.post("/register", register);

// Route: http://localhost:5050/api/auth/login
router.post("/login", login);
// Route: http://localhost:5050/api/auth/verify-otp
router.post("/verify-otp", verifyOtp);

module.exports = router;

// Password reset endpoints
// Route: http://localhost:5050/api/auth/request-password-reset
router.post("/request-password-reset", requestPasswordReset);

// Route: http://localhost:5050/api/auth/reset-password
router.post("/reset-password", resetPassword);
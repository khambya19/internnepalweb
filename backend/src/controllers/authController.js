const bcrypt = require("bcrypt");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const Joi = require("joi");
const { User, CompanyProfile, StudentProfile } = require("../models");
const sendEmail = require("../utils/sendEmail");
const { getProfileCompletionForUser } = require("../utils/profileCompletion");

const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$/;
const PASSWORD_POLICY_MESSAGE =
  "Password must be at least 8 characters, include uppercase, lowercase, number, and special character.";
const PASSWORD_RESET_GENERIC_MESSAGE = "If an account exists for this email, an OTP has been sent.";
const OTP_INVALID_MESSAGE = "Invalid or expired OTP.";
const OTP_BLOCKED_MESSAGE = "Too many invalid OTP attempts. Please request a new OTP and try again later.";
const OTP_MAX_ATTEMPTS = 5;
const OTP_BLOCK_WINDOW_MS = 10 * 60 * 1000;
const OTP_EXPIRES_MINUTES = 10;

// --- Joi Validation Schemas ---
const registerSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(100).pattern(PASSWORD_PATTERN).message(PASSWORD_POLICY_MESSAGE).required(),
  phone: Joi.string().min(7).max(15).required(),
  role: Joi.string().valid("student", "company").optional(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const requestPasswordResetSchema = Joi.object({
  email: Joi.string().email().required(),
});

const verifyResetOtpSchema = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.string().length(6).pattern(/^[0-9]{6}$/).required(),
});

const resetPasswordSchema = Joi.object({
  resetToken: Joi.string().required(),
  newPassword: Joi.string().min(8).max(100).pattern(PASSWORD_PATTERN).message(PASSWORD_POLICY_MESSAGE).required(),
  confirmPassword: Joi.any().valid(Joi.ref("newPassword")).required().messages({
    "any.only": "Passwords do not match.",
  }),
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(8).max(100).pattern(PASSWORD_PATTERN).message(PASSWORD_POLICY_MESSAGE).required(),
  confirmPassword: Joi.any().valid(Joi.ref("newPassword")).required().messages({
    "any.only": "Passwords do not match.",
  }),
})
  .custom((value, helpers) => {
    if (value.currentPassword === value.newPassword) {
      return helpers.error("any.invalid", {
        message: "New password must be different from current password.",
      });
    }
    return value;
  })
  .messages({
    "any.invalid": "{{#message}}",
  });

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

const parseValidationError = (error) => error?.details?.[0]?.message || "Validation failed";

const validatePayload = (schema, payload) => {
  const { error, value } = schema.validate(payload, {
    abortEarly: true,
    stripUnknown: true,
  });

  if (error) {
    return { ok: false, message: parseValidationError(error) };
  }

  return { ok: true, value };
};

const createOtp = () => crypto.randomInt(100000, 1000000).toString();

const createOtpExpiry = () => new Date(Date.now() + OTP_EXPIRES_MINUTES * 60 * 1000);

const isTruthy = (value) => ["1", "true", "yes", "on"].includes(String(value || "").trim().toLowerCase());

const logOtpForDemo = (purpose, email, otp) => {
  if (process.env.NODE_ENV === "production") return;
  if (!isTruthy(process.env.SHOW_OTP_IN_CONSOLE)) return;
  console.info(`[OTP:${purpose}] email=${email} otp=${otp} expiresIn=${OTP_EXPIRES_MINUTES}m`);
};

const hashPassword = async (rawPassword) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(rawPassword, salt);
};

const findUserByEmail = async (email) => User.findOne({ where: { email: normalizeEmail(email) } });

const isOtpValidForUser = (user, otp) => {
  if (!user) return false;
  if (!user.otp || user.otp !== otp) return false;
  if (!user.otpExpires || user.otpExpires < new Date()) return false;
  return true;
};

const isOtpBlocked = (user) => Boolean(user?.otpBlockedUntil && user.otpBlockedUntil > new Date());

const clearOtpAttemptState = (user) => {
  user.otpAttempts = 0;
  user.otpBlockedUntil = null;
};

const registerFailedOtpAttempt = async (user) => {
  if (!user) return false;

  user.otpAttempts = (Number(user.otpAttempts) || 0) + 1;

  if (user.otpAttempts >= OTP_MAX_ATTEMPTS) {
    user.otpAttempts = 0;
    user.otpBlockedUntil = new Date(Date.now() + OTP_BLOCK_WINDOW_MS);
    await user.save();
    return true;
  }

  await user.save();
  return false;
};

const buildResetSessionToken = (user) =>
  jwt.sign(
    {
      id: user.id,
      email: user.email,
      type: "password_reset",
      otp: user.otp,
    },
    process.env.JWT_SECRET,
    { expiresIn: "10m" }
  );

const validateResetSessionToken = (resetToken) => {
  try {
    const decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    if (!decoded || decoded.type !== "password_reset" || !decoded.id || !decoded.email || !decoded.otp) {
      return { ok: false, message: "Invalid reset session. Please verify OTP again." };
    }
    return { ok: true, decoded };
  } catch {
    return { ok: false, message: "Reset session expired. Please request a new OTP." };
  }
};

const ensureUserExistsForReset = async (decoded) => {
  const user = await User.findOne({
    where: {
      id: decoded.id,
      email: normalizeEmail(decoded.email),
    },
  });

  if (!user) {
    return { ok: false, message: "Invalid reset session. Please start again." };
  }

  return { ok: true, user };
};

const validateResetTokenAgainstUserOtp = (decoded, user) => {
  if (!user.otp || user.otp !== decoded.otp || !user.otpExpires || user.otpExpires < new Date()) {
    return { ok: false, message: "OTP expired or already used. Please request a new OTP." };
  }
  return { ok: true };
};

const sendRegistrationOtpEmail = (email, otp) => {
  logOtpForDemo("register", email, otp);
  return sendEmail({
    to: email,
    subject: "Verify your InternNepal account",
    html: `<p>Your OTP for InternNepal registration is: <b>${otp}</b></p><p>This code will expire in ${OTP_EXPIRES_MINUTES} minutes.</p>`,
  });
};

const sendResetOtpEmail = (email, otp) => {
  logOtpForDemo("password_reset", email, otp);
  return sendEmail({
    to: email,
    subject: "Password Reset OTP",
    html: `<p>Your OTP for password reset is: <b>${otp}</b></p><p>This code will expire in ${OTP_EXPIRES_MINUTES} minutes.</p>`,
  });
};

const buildSafeProfileCompletionFallback = (user) => ({
  role: String(user?.role || "").toLowerCase(),
  completed: false,
  requiredFields: [],
  missingFields: [],
});

// --- GET CURRENT USER (verify token) ---
exports.getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ["password", "otp", "otpExpires", "otpAttempts", "otpBlockedUntil", "tokenVersion"] },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    let companyProfile = null;
    let studentProfile = null;

    if (user.role === "company") {
      companyProfile = await CompanyProfile.findOne({
        where: { userId: user.id },
        attributes: [
          "id",
          "companyName",
          "logo",
          "banner",
          "location",
          "tagline",
          "industry",
          "about",
          "companySize",
          "foundedYear",
          "phone",
        ],
      });
    }

    if (user.role === "student") {
      studentProfile = await StudentProfile.findOne({
        where: { userId: user.id },
        attributes: ["id", "avatar", "university", "major", "graduationYear", "skills", "resumeUrl"],
      });
    }

    const profileCompletion = await getProfileCompletionForUser(user, {
      companyProfile,
      studentProfile,
    });

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        isVerified: user.isVerified,
        isActive: user.isActive,
        profileCompletion,
        CompanyProfile: companyProfile || null,
        StudentProfile: studentProfile || null,
      },
    });
  } catch (error) {
    console.error("[GetMe] Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// --- RESEND OTP (registration verification) ---
exports.resendOtp = async (req, res) => {
  try {
    const validation = validatePayload(requestPasswordResetSchema, req.body);
    if (!validation.ok) {
      return res.status(400).json({ success: false, message: validation.message });
    }

    const user = await findUserByEmail(validation.value.email);
    if (!user || user.isVerified) {
      return res.status(200).json({
        success: true,
        message: "If this account exists and is unverified, a new OTP has been sent.",
      });
    }

    user.otp = createOtp();
    user.otpExpires = createOtpExpiry();
    clearOtpAttemptState(user);
    await user.save();

    logOtpForDemo("resend", user.email, user.otp);
    await sendEmail({
      to: user.email,
      subject: "Your new OTP for InternNepal",
      html: `<p>Your new OTP is: <b>${user.otp}</b></p><p>This code will expire in ${OTP_EXPIRES_MINUTES} minutes.</p>`,
    });

    return res.status(200).json({
      success: true,
      message: "If this account exists and is unverified, a new OTP has been sent.",
    });
  } catch (error) {
    console.error("Resend OTP Error:", error);
    return res.status(500).json({ success: false, message: "Server error during OTP resend" });
  }
};

// --- REGISTER (Create New User) ---
exports.register = async (req, res) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: parseValidationError(error) });
    }

    const { name, email, password, role, phone } = value;

    const otp = createOtp();
    const otpExpires = createOtpExpiry();
    const hashedPassword = await hashPassword(password);

    let user;
    try {
      user = await User.create({
        name,
        email: normalizeEmail(email),
        phone,
        password: hashedPassword,
        role: role || "student",
        isVerified: false,
        otp,
        otpExpires,
        otpAttempts: 0,
        otpBlockedUntil: null,
      });
    } catch (err) {
      if (err.name === "SequelizeValidationError" || err.name === "SequelizeUniqueConstraintError") {
        return res.status(400).json({ success: false, message: err.errors[0].message });
      }
      throw err;
    }

    res.status(201).json({
      success: true,
      message: "User registered. OTP will be sent to email.",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      },
    });

    sendRegistrationOtpEmail(user.email, otp).catch((err) => {
      console.error("Error sending OTP email:", err);
    });
  } catch (error) {
    console.error("Register Error:", error);
    return res.status(500).json({ success: false, message: error.message || "Server error during registration" });
  }
};

// --- REQUEST PASSWORD RESET (OTP) ---
exports.requestPasswordReset = async (req, res) => {
  try {
    const validation = validatePayload(requestPasswordResetSchema, req.body);
    if (!validation.ok) {
      return res.status(400).json({ success: false, message: validation.message });
    }

    const user = await findUserByEmail(validation.value.email);
    if (!user) {
      return res.status(200).json({
        success: true,
        message: PASSWORD_RESET_GENERIC_MESSAGE,
      });
    }

    user.otp = createOtp();
    user.otpExpires = createOtpExpiry();
    clearOtpAttemptState(user);
    await user.save();

    await sendResetOtpEmail(user.email, user.otp);

    return res.status(200).json({
      success: true,
      message: PASSWORD_RESET_GENERIC_MESSAGE,
    });
  } catch (error) {
    console.error("Request Password Reset OTP Error:", error);
    return res.status(500).json({ success: false, message: "Server error during password reset request" });
  }
};

// --- VERIFY PASSWORD RESET OTP ---
exports.verifyResetOtp = async (req, res) => {
  try {
    const validation = validatePayload(verifyResetOtpSchema, req.body);
    if (!validation.ok) {
      return res.status(400).json({ success: false, message: validation.message });
    }

    const { email, otp } = validation.value;
    const user = await findUserByEmail(email);

    if (isOtpBlocked(user)) {
      return res.status(429).json({ success: false, message: OTP_BLOCKED_MESSAGE });
    }

    if (!isOtpValidForUser(user, otp)) {
      const justBlocked = await registerFailedOtpAttempt(user);
      if (justBlocked) {
        return res.status(429).json({ success: false, message: OTP_BLOCKED_MESSAGE });
      }
      return res.status(400).json({ success: false, message: OTP_INVALID_MESSAGE });
    }

    clearOtpAttemptState(user);
    await user.save();

    return res.status(200).json({
      success: true,
      message: "OTP verified.",
      resetToken: buildResetSessionToken(user),
    });
  } catch (error) {
    console.error("Verify Reset OTP Error:", error);
    return res.status(500).json({ success: false, message: "Server error during OTP verification" });
  }
};

// --- RESET PASSWORD WITH VERIFIED OTP SESSION ---
exports.resetPassword = async (req, res) => {
  try {
    const validation = validatePayload(resetPasswordSchema, req.body);
    if (!validation.ok) {
      return res.status(400).json({ success: false, message: validation.message });
    }

    const { resetToken, newPassword } = validation.value;
    const tokenValidation = validateResetSessionToken(resetToken);

    if (!tokenValidation.ok) {
      return res.status(400).json({ success: false, message: tokenValidation.message });
    }

    const userLookup = await ensureUserExistsForReset(tokenValidation.decoded);
    if (!userLookup.ok) {
      return res.status(400).json({ success: false, message: userLookup.message });
    }

    const user = userLookup.user;
    const otpSessionValidation = validateResetTokenAgainstUserOtp(tokenValidation.decoded, user);

    if (!otpSessionValidation.ok) {
      return res.status(400).json({ success: false, message: otpSessionValidation.message });
    }

    const sameAsCurrent = await bcrypt.compare(newPassword, user.password);
    if (sameAsCurrent) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from current password.",
      });
    }

    user.password = await hashPassword(newPassword);
    user.otp = null;
    user.otpExpires = null;
    clearOtpAttemptState(user);
    user.tokenVersion = (Number(user.tokenVersion) || 0) + 1;
    await user.save();

    return res.status(200).json({ success: true, message: "Password reset successful." });
  } catch (error) {
    console.error("Reset Password Error:", error);
    return res.status(500).json({ success: false, message: "Server error during password reset" });
  }
};

// --- CHANGE PASSWORD (authenticated) ---
exports.changePassword = async (req, res) => {
  try {
    const validation = validatePayload(changePasswordSchema, req.body);
    if (!validation.ok) {
      return res.status(400).json({ success: false, message: validation.message });
    }

    const { currentPassword, newPassword } = validation.value;
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const isCurrentMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentMatch) {
      return res.status(400).json({ success: false, message: "Current password is incorrect." });
    }

    const sameAsCurrent = await bcrypt.compare(newPassword, user.password);
    if (sameAsCurrent) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from current password.",
      });
    }

    user.password = await hashPassword(newPassword);
    user.tokenVersion = (Number(user.tokenVersion) || 0) + 1;
    await user.save();

    return res.status(200).json({ success: true, message: "Password changed successfully." });
  } catch (error) {
    console.error("Change Password Error:", error);
    return res.status(500).json({ success: false, message: "Server error during password change" });
  }
};

// --- VERIFY OTP (registration verification) ---
exports.verifyOtp = async (req, res) => {
  try {
    const validation = validatePayload(verifyResetOtpSchema, req.body);
    if (!validation.ok) {
      return res.status(400).json({ success: false, message: validation.message });
    }

    const { email, otp } = validation.value;
    const user = await findUserByEmail(email);

    if (!user || user.isVerified) {
      return res.status(400).json({ success: false, message: OTP_INVALID_MESSAGE });
    }

    if (isOtpBlocked(user)) {
      return res.status(429).json({ success: false, message: OTP_BLOCKED_MESSAGE });
    }

    if (!isOtpValidForUser(user, otp)) {
      const justBlocked = await registerFailedOtpAttempt(user);
      if (justBlocked) {
        return res.status(429).json({ success: false, message: OTP_BLOCKED_MESSAGE });
      }
      return res.status(400).json({ success: false, message: OTP_INVALID_MESSAGE });
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpires = null;
    clearOtpAttemptState(user);
    await user.save();

    // Create empty profile for new user
    try {
      if (user.role === 'student') {
        const existingProfile = await StudentProfile.findOne({ where: { userId: user.id } });
        if (!existingProfile) {
          await StudentProfile.create({ userId: user.id });
          console.log(`Created empty StudentProfile for user ${user.id}`);
        }
      } else if (user.role === 'company') {
        const existingProfile = await CompanyProfile.findOne({ where: { userId: user.id } });
        if (!existingProfile) {
          await CompanyProfile.create({ userId: user.id });
          console.log(`Created empty CompanyProfile for user ${user.id}`);
        }
      }
    } catch (profileError) {
      console.error('Error creating profile during OTP verification:', profileError);
      // Don't fail the verification if profile creation fails
    }

    return res.status(200).json({ success: true, message: "Account verified successfully" });
  } catch (error) {
    console.error("Verify OTP Error:", error);
    return res.status(500).json({ success: false, message: "Server error during OTP verification" });
  }
};

// --- LOGIN (Authenticate User) ---
exports.login = async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: parseValidationError(error),
      });
    }

    const { email, password } = value;
    const user = await findUserByEmail(email);

    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    if (user.role !== "superadmin" && user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive. Please contact support.",
      });
    }

    if (!user.isVerified && user.role !== "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Please verify your email before logging in.",
        needsVerification: true,
        email: user.email,
      });
    }

    if (!user.password || typeof user.password !== "string") {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const jwtExpire = process.env.JWT_EXPIRE || "7d";
    const token = jwt.sign(
      { id: user.id, role: user.role, tokenVersion: Number(user.tokenVersion) || 0 },
      process.env.JWT_SECRET,
      {
        expiresIn: jwtExpire,
      }
    );

    let profileCompletion = buildSafeProfileCompletionFallback(user);
    try {
      profileCompletion = await getProfileCompletionForUser(user);
    } catch (profileError) {
      console.error("[Login] Profile completion lookup failed:", profileError.message);
    }

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        isActive: user.isActive,
        profileCompletion,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    const message =
      process.env.NODE_ENV === "production"
        ? "Server error during login"
        : `Server error during login: ${error.message}`;
    return res.status(500).json({ success: false, message });
  }
};

// --- LOGOUT (invalidate active JWTs for this account) ---
exports.logout = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(200).json({ success: true, message: "Logged out." });
    }

    user.tokenVersion = (Number(user.tokenVersion) || 0) + 1;
    await user.save();

    return res.status(200).json({ success: true, message: "Logged out." });
  } catch (error) {
    console.error("Logout Error:", error);
    return res.status(500).json({ success: false, message: "Server error during logout" });
  }
};

// --- DELETE ACCOUNT (authenticated) ---
exports.deleteAccount = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.role === "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Super admin account cannot be deleted from this endpoint.",
      });
    }

    await user.destroy();

    return res.status(200).json({
      success: true,
      message: "Account deleted successfully.",
    });
  } catch (error) {
    console.error("Delete Account Error:", error);
    return res.status(500).json({ success: false, message: "Server error during account deletion" });
  }
};

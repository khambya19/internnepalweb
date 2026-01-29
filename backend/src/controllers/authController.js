// --- VERIFY PASSWORD RESET OTP ---
exports.verifyResetOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: "Email and OTP are required" });
    }
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ success: false, message: "Invalid email or OTP" });
    }
    if (!user.otp || user.otp !== otp || !user.otpExpires || user.otpExpires < new Date()) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
    }
    res.status(200).json({ success: true, message: "OTP verified" });
  } catch (error) {
    console.error("Verify Reset OTP Error:", error);
    res.status(500).json({ success: false, message: "Server error during OTP verification" });
  }
};
// --- RESEND OTP ---
exports.resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email is required" });

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    if (user.isVerified) return res.status(400).json({ success: false, message: "User already verified" });

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    // Send OTP email
    await sendEmail({
      to: email,
      subject: "Your new OTP for InternNepal",
      html: `<p>Your new OTP is: <b>${otp}</b></p><p>This code will expire in 10 minutes.</p>`
    });

    res.status(200).json({ success: true, message: "OTP resent" });
  } catch (error) {
    console.error("Resend OTP Error:", error);
    res.status(500).json({ success: false, message: "Server error during OTP resend" });
  }
};

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const Joi = require("joi");
const User = require("../models/User");
const PasswordResetToken = require("../models/PasswordResetToken");
const sendEmail = require("../utils/sendEmail");

// --- Joi Validation Schemas ---
const registerSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(100)
    .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$"))
    .message("Password must be at least 8 characters, include uppercase, lowercase, number, and special character.")
    .required(),
  phone: Joi.string().min(7).max(15).required(),
  role: Joi.string().valid('student', 'company', 'admin').optional()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const resetPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.string().length(6).required(),
  newPassword: Joi.string().min(8).max(100)
    .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$"))
    .message("Password must be at least 8 characters, include uppercase, lowercase, number, and special character.")
    .required()
});

// --- REGISTER (Create New User) ---
exports.register = async (req, res) => {
  try {
    // Joi validation
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }
    const { name, email, password, role, phone } = value;

    // Check if user already exists
    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "User already exists"
      });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create the user in Database (unverified)
    let user;
    try {
      user = await User.create({
        name,
        email,
        phone,
        password: hashedPassword,
        role: role || 'student',
        isVerified: false,
        otp,
        otpExpires
      });
    } catch (err) {
      // Sequelize validation error
      if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({ success: false, message: err.errors[0].message });
      }
      throw err;
    }

    // Send Success Response immediately
    res.status(201).json({
      success: true,
      message: "User registered. OTP will be sent to email.",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified
      }
    });

    // Send OTP Email asynchronously (does not block response)
    sendEmail({
      to: email,
      subject: "Verify your InternNepal account",
      html: `<p>Your OTP for InternNepal registration is: <b>${otp}</b></p><p>This code will expire in 10 minutes.</p>`
    }).catch((err) => {
      console.error("Error sending OTP email:", err);
    });

  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ success: false, message: error.message || "Server error during registration" });
  }
};
// --- REQUEST PASSWORD RESET (OTP) ---
exports.requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ success: false, message: "No user found with that email" });
    }
    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();
    // Send OTP email
    await sendEmail({
      to: email,
      subject: "Password Reset OTP",
      html: `<p>Your OTP for password reset is: <b>${otp}</b></p><p>This code will expire in 10 minutes.</p>`
    });
    res.status(200).json({ success: true, message: "OTP sent to your email." });
  } catch (error) {
    console.error("Request Password Reset OTP Error:", error);
    res.status(500).json({ success: false, message: "Server error during password reset request" });
  }
};

// --- RESET PASSWORD WITH OTP ---
exports.resetPassword = async (req, res) => {
  try {
    // Joi validation
    const { error, value } = resetPasswordSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }
    const { email, otp, newPassword } = value;
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ success: false, message: "Invalid email or OTP" });
    }
    if (!user.otp || user.otp !== otp || !user.otpExpires || user.otpExpires < new Date()) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
    }
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    user.password = hashedPassword;
    user.otp = null;
    user.otpExpires = null;
    await user.save();
    res.status(200).json({ success: true, message: "Password reset successful" });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ success: false, message: "Server error during password reset" });
  }
};

// --- LOGIN (Authenticate User) ---
// --- VERIFY OTP ---
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: "Email and OTP are required" });
    }
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    if (user.isVerified) {
      return res.status(400).json({ success: false, message: "User already verified" });
    }
    console.log('DEBUG OTP: DB value =', user.otp, '| Submitted =', otp);
    if (user.otp !== otp) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }
    if (!user.otpExpires || new Date() > user.otpExpires) {
      return res.status(400).json({ success: false, message: "OTP expired" });
    }
    user.isVerified = true;
    user.otp = null;
    user.otpExpires = null;
    await user.save();
    return res.status(200).json({ success: true, message: "Account verified successfully" });
  } catch (error) {
    console.error("Verify OTP Error:", error);
    res.status(500).json({ success: false, message: "Server error during OTP verification" });
  }
};
exports.login = async (req, res) => {
  try {
    // Joi validation
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }
    const { email, password } = value;

    // Find user
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    // Generate Token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    // Send Success Response
    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during login"
    });
  }
};
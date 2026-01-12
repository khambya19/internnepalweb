const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const PasswordResetToken = require("../models/PasswordResetToken");
const sendEmail = require("../utils/sendEmail");

// --- REGISTER (Create New User) ---
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // 1. Validation
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Please provide all fields" });
    }

    // 2. Check if user already exists
    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "User already exists"
      });
    }

    // 3. Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Create the user in Database
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || 'user'
    });

    // 5. Generate Token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    // 6. Send Success Response
    res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ success: false, message: "Server error during registration" });
  }
};
// --- REQUEST PASSWORD RESET ---
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
    // Invalidate previous tokens
    await PasswordResetToken.update({ used: true }, { where: { userId: user.id } });
    // Generate token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour
    await PasswordResetToken.create({ userId: user.id, token, expiresAt });
    // Send email
    const resetUrl = `${process.env.FRONTEND_URL}/auth/forgot-password?token=${token}&email=${encodeURIComponent(email)}`;
    await sendEmail({
      to: email,
      subject: "Password Reset Request",
      html: `<p>You requested a password reset for your InternNepal account.</p><p><a href="${resetUrl}">Click here to reset your password</a></p><p>This link will expire in 1 hour.</p>`
    });
    res.status(200).json({ success: true, message: "Password reset email sent" });
  } catch (error) {
    console.error("Request Password Reset Error:", error);
    res.status(500).json({ success: false, message: "Server error during password reset request" });
  }
};

// --- RESET PASSWORD ---
exports.resetPassword = async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;
    if (!email || !token || !newPassword) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ success: false, message: "Invalid email or token" });
    }
    const resetToken = await PasswordResetToken.findOne({
      where: {
        userId: user.id,
        token,
        used: false,
        expiresAt: { [require('sequelize').Op.gt]: new Date() }
      }
    });
    if (!resetToken) {
      return res.status(400).json({ success: false, message: "Invalid or expired token" });
    }
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    user.password = hashedPassword;
    await user.save();
    resetToken.used = true;
    await resetToken.save();
    res.status(200).json({ success: true, message: "Password reset successful" });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ success: false, message: "Server error during password reset" });
  }
};

// --- LOGIN (Authenticate User) ---
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    // 2. Find user
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    // 3. Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    // 4. Generate Token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    // 5. Send Success Response
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
const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware to protect routes and verify JWT
 */
const protect = async (req, res, next) => {
  let token;

  // 1. Check if token exists in headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // 2. Get token from header
      token = req.headers.authorization.split(' ')[1];

      // 3. Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 4. Attach user to request object (excluding password)
      req.user = await User.findByPk(decoded.id, {
        attributes: { exclude: ['password'] }
      });

      if (!req.user) {
        return res.status(401).json({ success: false, message: 'User not found with this token' });
      }

      const expectedTokenVersion = Number(req.user.tokenVersion) || 0;
      const presentedTokenVersion = Number(decoded.tokenVersion);
      if (presentedTokenVersion !== expectedTokenVersion) {
        return res.status(401).json({ success: false, message: 'Session expired. Please login again.' });
      }

      next();
    } catch (error) {
      console.error('[Auth Middleware] Token verification error:', error.name);
      return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }
};

module.exports = { protect };

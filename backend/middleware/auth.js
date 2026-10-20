const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');

const protect = async (req, res, next) => {
  try {
    let token = null;

    // Check HTTP-only cookie first
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      // Fallback to Bearer token in Authorization header
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('Authentication required. Please log in.', 401));
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_jwt_secret');
    } catch (err) {
      return next(new AppError('Invalid or expired authentication session. Please log in again.', 401));
    }

    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return next(new AppError('The user account belonging to this token no longer exists.', 401));
    }

    if (!currentUser.isActive) {
      return next(new AppError('Your account has been deactivated. Please contact an administrator.', 403));
    }

    req.user = currentUser;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { protect };

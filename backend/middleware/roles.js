const AppError = require('../utils/AppError');

/**
 * Middleware to restrict access to specific user roles.
 * @param  {...string} roles - Permitted roles (e.g. 'admin', 'staff')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          `Access denied. Your role '${req.user.role}' is not authorized to perform this action.`,
          403
        )
      );
    }

    next();
  };
};

module.exports = { authorize };

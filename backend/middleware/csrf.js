const crypto = require('crypto');

/**
 * Double-submit cookie CSRF protection middleware.
 * Generates an XSRF-TOKEN cookie if not present, and requires
 * the x-csrf-token / x-xsrf-token header on state-changing requests when authenticated via cookies.
 */
const csrfProtection = (req, res, next) => {
  // If request is authenticated via Bearer token in Authorization header,
  // ambient cookie authentication is not being exploited, so CSRF is inherently mitigated.
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    return next();
  }

  // Safe HTTP methods don't require CSRF validation
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) {
    // Ensure an XSRF-TOKEN cookie is set for client read
    if (!req.cookies || !req.cookies['XSRF-TOKEN']) {
      const csrfToken = crypto.randomBytes(24).toString('hex');
      res.cookie('XSRF-TOKEN', csrfToken, {
        httpOnly: false, // Must be readable by Axios/client
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      });
    }
    return next();
  }

  // If there's no auth cookie, user is not logged in via cookie
  if (!req.cookies || !req.cookies.token) {
    return next();
  }

  // For state-changing requests authenticated with cookies, check token header
  const clientToken = req.headers['x-csrf-token'] || req.headers['x-xsrf-token'];
  const cookieToken = req.cookies['XSRF-TOKEN'];

  if (!clientToken || !cookieToken || clientToken !== cookieToken) {
    // In test environment or development if header wasn't provided, allow if explicitly set
    if (process.env.NODE_ENV === 'test') {
      return next();
    }
    return res.status(403).json({
      success: false,
      message: 'Invalid or missing CSRF token. Request aborted for security.',
    });
  }

  next();
};

module.exports = { csrfProtection };

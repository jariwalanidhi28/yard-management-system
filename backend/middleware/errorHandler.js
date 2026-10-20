const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode || 500;

  // Log in development
  if (process.env.NODE_ENV !== 'test') {
    console.error(`[Error] ${req.method} ${req.originalUrl}:`, err);
  }

  // Mongoose bad ObjectId (CastError)
  if (err.name === 'CastError') {
    const message = `Resource not found with invalid ID: ${err.value}`;
    error.statusCode = 404;
    error.message = message;
  }

  // Mongoose duplicate key error (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const val = err.keyValue ? err.keyValue[field] : '';
    const message = `Duplicate value '${val}' for field '${field}'. Please provide a unique value.`;
    error.statusCode = 409;
    error.message = message;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
    error.statusCode = 400;
    error.message = message;
  }

  // JSON Web Token errors
  if (err.name === 'JsonWebTokenError') {
    error.statusCode = 401;
    error.message = 'Invalid authentication token. Please log in again.';
  }

  if (err.name === 'TokenExpiredError') {
    error.statusCode = 401;
    error.message = 'Authentication token expired. Please log in again.';
  }

  const responsePayload = {
    success: false,
    message: error.message || 'Internal Server Error',
  };

  // Only include stack trace in non-production environments when not an operational error
  if (process.env.NODE_ENV === 'development' && !err.isOperational) {
    responsePayload.stack = err.stack;
  }

  res.status(error.statusCode).json(responsePayload);
};

module.exports = errorHandler;

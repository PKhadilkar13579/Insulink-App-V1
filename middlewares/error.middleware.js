'use strict';

module.exports = (err, req, res, next) => {
  // If headers already sent, delegate to default Express handler
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.status || err.statusCode || 500;

  const response = {
    success: false,
    message: err.message || "Internal Server Error"
  };

  // Optional: include validation / sequelize errors if present
  if (err.errors) {
    response.errors = err.errors;
  }

  // Optional: include stack trace only in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  return res.status(statusCode).json(response);
};
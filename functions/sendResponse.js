const createError = require("http-errors");

/* =========================
   SUCCESS RESPONSES
========================= */

exports.sendCreateResponse = (req, res) => {
  return res.status(201).json({
    success: true,
    message: "Resource created successfully",
    data: res.locals.data ?? null
  });
};

exports.sendFindResponse = (req, res) => {
  return res.status(200).json({
    success: true,
    data: res.locals.data ?? []
  });
};

/* =========================
   ERROR HELPERS
========================= */

exports.handleError = async (
  err,
  next,
  defaultMessage = "Something went wrong",
  transaction = null
) => {
  if (transaction) await transaction.rollback();

  const statusCode = err?.status || err?.statusCode || 500;

  const message =
    err?.errors?.[0]?.message ||
    err?.message ||
    defaultMessage;

  const error = createError(statusCode, message);

  // attach raw errors if present (sequelize, validation, etc.)
  error.errors = err?.errors || null;

  return next(error);
};

exports.sendError = async (
  next,
  message = "Bad Request",
  statusCode = 400,
  transaction = null,
  errors = null
) => {
  if (transaction) await transaction.rollback();

  const error = createError(statusCode, message);
  error.errors = errors;

  return next(error);
};

exports.HTTPError = (status, message, errors = null) => {
  const error = createError(status, message);
  error.errors = errors;
  return error;
};
const mongoose = require("mongoose");
const httpStatus = require("http-status");

const logger = require("../config/logger");
const ApiError = require("../utils/ApiError");

const NODE_ENV = process.env.NODE_ENV || "development";

const IS_DEVELOPMENT = NODE_ENV === "development";
const IS_PRODUCTION = NODE_ENV === "production";

/**
 * Convert unknown errors into ApiError
 */
const errorConverter = (err, req, res, next) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    let statusCode = httpStatus.status.INTERNAL_SERVER_ERROR;

    /*
     * Mongoose errors
     */
    if (error instanceof mongoose.Error) {
      statusCode = httpStatus.status.BAD_REQUEST;
    }
    /*
     * Custom errors with statusCode
     */
    else if (error.statusCode) {
      statusCode = error.statusCode;
    }

    const message =
      error.message ||
      httpStatus[statusCode] ||
      "Internal Server Error";

    error = new ApiError(
      statusCode,
      message,
      false,
      err.stack
    );
  }

  next(error);
};

/**
 * Handle API errors
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let { statusCode, message } = err;

  /*
   * Hide internal error details in production.
   */
  if (IS_PRODUCTION && !err.isOperational) {
    statusCode = httpStatus.status.INTERNAL_SERVER_ERROR;
    message =
      httpStatus[httpStatus.status.INTERNAL_SERVER_ERROR];
  }

  /*
   * Used by Morgan error logger.
   */
  res.locals.errorMessage = err.message;

  /*
   * Response format
   */
  const response = {
    message,
    data: [],
  };

  /*
   * Stack trace should only be exposed
   * during development.
   */
  if (IS_DEVELOPMENT) {
    response.stack = err.stack;
  }

  /*
   * Log errors.
   *
   * Development:
   *   Full error object
   *
   * UAT/Production:
   *   Error message + stack through logger
   */
  if (IS_DEVELOPMENT) {
    logger.error(err);
  } else {
    logger.error(
      `[${NODE_ENV}] ${req.method} ${req.originalUrl} - ${err.message}`
    );
  }

  res.status(statusCode).send(response);
};

module.exports = {
  errorConverter,
  errorHandler,
};
const morgan = require('morgan');
const logger = require('./logger');

const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PRODUCTION = NODE_ENV === 'production';

/**
 * Custom token for error messages
 */
morgan.token('message', (req, res) => {
  return res.locals.errorMessage || '';
});

/**
 * Show client IP only in production
 */
const getIpFormat = () => {
  return IS_PRODUCTION ? ':remote-addr - ' : '';
};

/**
 * Log formats
 */
const successResponseFormat =
  `${getIpFormat()}:method :url :status - :response-time ms`;

const errorResponseFormat =
  `${getIpFormat()}:method :url :status - :response-time ms - message: :message`;

/**
 * Routes that should not be logged
 */
const shouldSkipActivities = (req) => {
  return req.originalUrl === '/api/v1/activities';
};

/**
 * Success request logger
 *
 * Logs:
 * - 2xx
 * - 3xx
 */
const successHandler = morgan(successResponseFormat, {
  skip: (req, res) =>
    shouldSkipActivities(req) || res.statusCode >= 400,

  stream: {
    write: (message) => {
      logger.info(message.trim());
    },
  },
});

/**
 * Error request logger
 *
 * Logs:
 * - 4xx
 * - 5xx
 */
const errorHandler = morgan(errorResponseFormat, {
  skip: (req, res) =>
    shouldSkipActivities(req) || res.statusCode < 400,

  stream: {
    write: (message) => {
      logger.error(message.trim());
    },
  },
});

module.exports = {
  successHandler,
  errorHandler,
};
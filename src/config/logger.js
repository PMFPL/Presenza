const winston = require('winston');

const NODE_ENV = process.env.NODE_ENV || 'development';

const IS_DEVELOPMENT = NODE_ENV === 'development';
const IS_UAT = NODE_ENV === 'uat';
const IS_PRODUCTION = NODE_ENV === 'production';

/**
 * Include stack trace when logging an Error object
 */
const enumerateErrorFormat = winston.format((info) => {
  if (info instanceof Error) {
    Object.assign(info, {
      message: info.stack,
    });
  }

  return info;
});

/**
 * Logger configuration
 */
const logger = winston.createLogger({
  level: IS_DEVELOPMENT ? 'debug' : 'info',

  format: winston.format.combine(
    enumerateErrorFormat(),

    IS_DEVELOPMENT
      ? winston.format.colorize()
      : winston.format.uncolorize(),

    winston.format.splat(),

    winston.format.printf(({ level, message }) => {
      return `${level}: ${message}`;
    })
  ),

  transports: [
    new winston.transports.Console({
      stderrLevels: ['error'],
    }),
  ],
});

module.exports = logger;


const winston = require('winston');

const _ = require('lodash')

// Set custom log levels
const logLevels = {
  fatal: 0,
  error: 1,
  warn: 2,
  reaction: 3,
  info: 4,
  debug: 5,
  trace: 6,
  console: 7
};

const errorFilter = winston.format((info, opts) => {
  return info.level === 'error' ? info : false;
});
const warningsFilter = winston.format((info, opts) => {
  return info.level === 'warn' ? info : false;
});
const reactionFilter = winston.format((info, opts) => {
  return info.level === 'reaction' ? info : false;
});
const traceFilter = winston.format((info, opts) => {
  return info.level === 'trace' ? info : false;
});
const infoFilter = winston.format((info, opts) => {
  return info.level === 'info' ? info : false;
});

const { combine, timestamp, printf, colorize, align, json, label } = winston.format;

const textFormat = printf(({ level, message, label, timestamp }) => {
  return `${message}`;
});


// main logger
const logger = winston.createLogger({
    levels: logLevels,
    transports: [
        new winston.transports.Console(),
    ]
});

module.exports = logger


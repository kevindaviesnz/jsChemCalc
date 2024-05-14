// https://www.npmjs.com/package/winston
// @see https://betterstack.com/community/guides/logging/how-to-install-setup-and-use-winston-and-morgan-to-log-node-js-applications/
// @see https://zetcode.com/javascript/winston/
const winston = require('winston');
const logLevels = {
  fatal: 0,
  error: 1,
  warn: 2,
  reaction: 3,
  info: 4,
  debug: 5,
  trace: 6,
  console: 7,
};


const { combine, timestamp, printf, colorize, align, json, label } = winston.format;



const errorFilter = winston.format((info, opts) => {
  return info.level === 'error' ? info : false;
});

const warningsFilter = winston.format((info, opts) => {
  return info.level === 'warn' ? info : false;
});

const traceFilter = winston.format((info, opts) => {
  return info.level === 'trace' ? info : false;
});

const reactionsFilter = winston.format((info, opts) => {
  return info.level === 'reaction' ? info : false;
});

const logger = winston.createLogger({
    levels: logLevels,
    transports: [
    ]
});


logger.configure({
    level: 'warn',
    transports: [
        new winston.transports.File({
              filename: 'warnings.log',
              level: 'warn',
              format: combine(warningsFilter(), timestamp(), json()),
         })
    ]
});

logger.configure({
    level: 'error',
    transports: [
        new winston.transports.File({
              filename: 'error.log',
              level: 'error',
              format: combine(errorFilter(), timestamp(), json()),
         })
    ]
});

logger.configure({
   levels: logLevels,
    level: 'reaction',
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({
              filename: 'reactions.log',
              level: 'reaction',
              format: combine(reactionsFilter(), timestamp(), json()),
         })
    ]
});

// Console logging
const textFormat = printf(({ level, message, label, timestamp }) => {
  return `${timestamp} [${label}] ${level}: ${message}`;
});

winston.loggers.add('consoleLogger', {
  levels: logLevels,
  level: 'console',
  format: combine(
      label({ label: 'right meow!' }),
      timestamp(),
      textFormat
    ),
  transports: [
    new winston.transports.Console(),
  ],
});
const consoleLogger = winston.loggers.get('consoleLogger');


logger.info('Information message 2');
logger.reaction('reaction message 2');
logger.trace('Trace');
logger.warn('Warning message 2');
logger.error('Error message 2');

consoleLogger.error('Error message to console only')








/*
const test_logger = winston.createLogger({
    levels: logLevels,
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({
              filename: 'info.log',
              level: 'info',
              format: combine(infoFilter(), timestamp(), json()),
         }),
        new winston.transports.File({
              filename: 'warn.log',
              level: 'warn',
              format: combine(warningsFilter(), timestamp(), json()),
         }),
        new winston.transports.File({
              filename: 'reactions.log',
              level: 'reaction',
              format: combine(reactionsFilter(), timestamp(), json()),
         })

    ],
  });

test_logger.configure({
    level: 'trace',
    transports: [
        new winston.transports.Console()
    ]
});
*/

/*



*/

/*
if (process.env.NODE_ENV !== 'production') {
    test_logger.add(new winston.transports.Console({
        format: winston.format.simple(),
    }));
}
*/

///test_logger.info('Info message');
//test_logger.error('Error message');
//test_logger.warn('Warning message');
//test_logger.reaction('Reaction message');
//test_logger.trace('trace message');


// Log levels
/*
{
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6
}

logger.error('error');
logger.warn('warn');
logger.info('info');
logger.verbose('verbose');
logger.debug('debug');
logger.silly('silly');
*/





  console.log('tests done')

  //process.exit()

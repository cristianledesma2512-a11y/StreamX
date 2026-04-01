const { createLogger, format, transports } = require('winston');
const path = require('path');
const fs = require('fs');

const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

const isProd = process.env.NODE_ENV === 'production';

const logger = createLogger({
  level: isProd ? 'info' : 'debug',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.json()
  ),
  transports: [
    new transports.File({ filename: path.join(logsDir, 'error.log'), level: 'error', maxsize: 5_000_000, maxFiles: 3 }),
    new transports.File({ filename: path.join(logsDir, 'combined.log'), maxsize: 10_000_000, maxFiles: 5 }),
  ],
});

if (!isProd) {
  logger.add(new transports.Console({
    format: format.combine(format.colorize(), format.simple()),
  }));
}

module.exports = logger;

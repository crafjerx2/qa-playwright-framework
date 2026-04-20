/**
 * SINGLE RESPONSIBILITY PRINCIPLE
 *
 * Logger has ONE job: structured logging.
 * It does NOT know about pages, browsers, or tests.
 * If logging strategy changes → only this file changes.
 */
import * as winston from 'winston';
import * as path from 'path';
import * as fs from 'fs';

const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    return stack
      ? `[${timestamp as string}] ${level.toUpperCase()}: ${message as string}\n${stack as string}`
      : `[${timestamp as string}] ${level.toUpperCase()}: ${message as string}`;
  }),
);

export const Logger = winston.createLogger({
  level: process.env['LOG_LEVEL'] ?? 'info',
  format: logFormat,
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), logFormat),
    }),
    new winston.transports.File({
      filename: path.join(logsDir, 'test-execution.log'),
      maxsize: 5 * 1024 * 1024,
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: path.join(logsDir, 'errors.log'),
      level: 'error',
    }),
  ],
});

// Convenience methods that add context
export const TestLogger = {
  testStart: (testName: string): void => {
    Logger.info(`TEST STARTED: ${testName}`);
  },
  testPass: (testName: string): void => {
    Logger.info(`TEST PASSED: ${testName}`);
  },
  testFail: (testName: string, reason: string): void => {
    Logger.error(`TEST FAILED: ${testName} | Reason: ${reason}`);
  },
  step: (description: string): void => {
    Logger.info(`  -> STEP: ${description}`);
  },
  apiRequest: (method: string, url: string): void => {
    Logger.debug(`  -> ${method} ${url}`);
  },
  apiResponse: (status: number, url: string): void => {
    Logger.debug(` <- ${status} ${url}`);
  },
  infor: (description: string): void => {
    Logger.info(`  -> INFO: ${description}`);
  },
};

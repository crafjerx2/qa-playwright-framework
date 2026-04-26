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

const LOGS_DIR = path.join(process.cwd(), 'logs');
const SCREENSHOTS_DIR = path.join(process.cwd(), 'test-results', 'screenshots');

[LOGS_DIR, SCREENSHOTS_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? `${JSON.stringify(meta)}` : '';
    return `[${timestamp as string}] ${level}: ${message as string}${metaStr}`;
  }),
);

/**
 * File format — full detail with ISO timestamps, no colors
 */ const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

const logLevel = process.env['LOG_LEVEL'] ?? 'info';

const winstonLogger = winston.createLogger({
  level: logLevel,
  defaultMeta: {
    framework: 'QA Playwright Framework',
    environment: process.env['ENV'] ?? 'qa',
  },
  transports: [
    new winston.transports.Console({
      format: consoleFormat,
      level: 'info',
      silent: process.env['LOG_SILENT'] === 'true',
    }),
    new winston.transports.File({
      filename: path.join(LOGS_DIR, 'test-execution.log'),
      format: fileFormat,
      maxsize: 5 * 1024 * 1024, // 10MB
      maxFiles: 5,
      tailable: true,
    }),
    new winston.transports.File({
      filename: path.join(LOGS_DIR, 'errors.log'),
      format: fileFormat,
      level: 'error',
      maxsize: 5 * 1024 * 1024, // 5MB
      maxFiles: 3,
    }),
  ],
});

/**
 * Creates a new timestamped log file per test session.
 * Useful for keeping individual run history.
 */
function createSessionLog(): void {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const sessionLogPath = path.join(LOGS_DIR, `session-${timestamp}.log`);

  winstonLogger.add(
    new winston.transports.File({
      filename: sessionLogPath,
      format: fileFormat,
      level: 'debug',
    }),
  );
}

// Only create session log if logging to file is enabled
if (process.env['LOG_TO_FILE'] !== 'false') {
  createSessionLog();
}

// Convenience methods that add context
export const TestLogger = {
  /**
   * Logs the start of a test session.
   */
  sessionStart(environment: string, browser: string): void {
    winstonLogger.info('═══ TEST SESSION STARTED ═══', {
      environment,
      browser,
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
    });
  },
  /**
   * Logs the end of a test session with summary.
   */
  sessionEnd(passed: number, failed: number, skipped: number): void {
    const total = passed + failed + skipped;
    const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;

    winstonLogger.info('═══ TEST SESSION ENDED ═══', {
      total,
      passed,
      failed,
      skipped,
      passRate: `${passRate}%`,
    });
  },
  /**
   * Logs the start of a test.
   * @param testName - Full test name including describe block
   */
  testStart(testName: string): void {
    winstonLogger.info(`STARTED: ${testName}`, { event: 'test_start' });
  },

  /**
   * Logs a test pass with duration.
   * @param testName - Test name
   * @param durationMs - Test duration in milliseconds
   */
  testPass(testName: string, durationMs?: number): void {
    winstonLogger.info(`PASSED: ${testName}`, {
      event: 'test_pass',
      duration: durationMs ? `${durationMs}ms` : undefined,
    });
  },

  /**
   * Logs a test failure with error details.
   * @param testName - Test name
   * @param error - Error message or Error object
   * @param screenshotPath - Path to failure screenshot
   */
  testFail(testName: string, error: string | Error, screenshotPath?: string): void {
    const message = error instanceof Error ? error.message : error;
    winstonLogger.error(`FAILED: ${testName}`, {
      event: 'test_fail',
      error: message,
      stack: error instanceof Error ? error.stack : undefined,
      screenshot: screenshotPath,
    });
  },

  /**
   * Logs a skipped test.
   */
  testSkip(testName: string, reason?: string): void {
    winstonLogger.warn(`SKIPPED: ${testName}`, {
      event: 'test_skip',
      reason,
    });
  },

  /**
   * Logs a test retry attempt.
   */
  testRetry(testName: string, attempt: number, maxAttempts: number): void {
    winstonLogger.warn(`RETRY ${attempt}/${maxAttempts}: ${testName}`, {
      event: 'test_retry',
      attempt,
      maxAttempts,
    });
  },

  // ─── Step logging ────────────────────────────────────────

  /**
   * Logs a test step — the most commonly used method.
   * @param description - What the step is doing
   */
  step(description: string): void {
    winstonLogger.info(`  -> ${description}`, { event: 'step' });
  },

  /**
   * Logs a step with additional context data.
   */
  stepWithData(description: string, data: Record<string, unknown>): void {
    winstonLogger.info(`  -> ${description}`, { event: 'step', ...data });
  },

  // ─── API logging ─────────────────────────────────────────

  /**
   * Logs an outgoing API request.
   */
  apiRequest(method: string, url: string, body?: unknown): void {
    winstonLogger.debug(`  ${method} ${url}`, {
      event: 'api_request',
      method,
      url,
      hasBody: !!body,
    });
  },

  /**
   * Logs an API response.
   */
  apiResponse(status: number, url: string, durationMs?: number): void {
    const level = status >= 400 ? 'warn' : 'debug';
    winstonLogger[level](`  ${status} ${url}`, {
      event: 'api_response',
      status,
      url,
      duration: durationMs,
    });
  },

  // ─── Navigation logging ──────────────────────────────────

  /**
   * Logs a page navigation.
   */
  navigate(url: string): void {
    winstonLogger.info(`  Navigate: ${url}`, {
      event: 'navigate',
      url,
    });
  },

  // ─── Screenshot/video logging ────────────────────────────

  /**
   * Logs a screenshot capture.
   */
  screenshot(name: string, filePath: string): void {
    winstonLogger.info(`  Screenshot: ${name}`, {
      event: 'screenshot',
      path: filePath,
    });
  },

  /**
   * Logs a video recording.
   */
  video(filePath: string): void {
    winstonLogger.info(`  Video saved: ${filePath}`, {
      event: 'video',
      path: filePath,
    });
  },

  // ─── General purpose ─────────────────────────────────────

  debug(message: string, meta?: Record<string, unknown>): void {
    winstonLogger.debug(message, meta);
  },

  info(message: string, meta?: Record<string, unknown>): void {
    winstonLogger.info(message, meta);
  },

  warn(message: string, meta?: Record<string, unknown>): void {
    winstonLogger.warn(message, meta);
  },

  error(message: string, error?: Error | string): void {
    if (error instanceof Error) {
      winstonLogger.error(message, {
        error: error.message,
        stack: error.stack,
      });
    } else {
      winstonLogger.error(message, { error });
    }
  },
};

// Export raw logger for advanced use
export { winstonLogger as Logger };

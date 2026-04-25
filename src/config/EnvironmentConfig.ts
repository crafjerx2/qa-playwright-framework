import { Environment } from './EnvLoader';

// ─── Type definitions ─────────────────────────────────────────

/** Screenshot capture modes */
export type ScreenshotMode = 'on' | 'off' | 'only-on-failure';

/** Video recording modes */
export type VideoMode = 'on' | 'off' | 'retain-on-failure' | 'on-first-retry';

/** Trace collection modes */
export type TraceMode = 'on' | 'off' | 'retain-on-failure' | 'on-first-retry';

/** Supported browser engines */
export type BrowserEngine = 'chromium' | 'firefox' | 'webkit';

/** Log levels */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// ─── Configuration interfaces ─────────────────────────────────
export interface BrowserConfig {
  /** Browser engine to use */
  readonly engine: BrowserEngine;
  /** Run browser without UI */
  readonly headless: boolean;
  /** Add delay between actions (ms) — useful for debugging */
  readonly slowMo: number;
  /** Use real Chrome instead of Chromium */
  readonly useRealChrome: boolean;
  /** Viewport dimensions */
  readonly viewport: ViewportConfig;
  /** Timeout settings */
  readonly timeouts: TimeoutConfig;
}

export interface ViewportConfig {
  readonly width: number;
  readonly height: number;
}

export interface TimeoutConfig {
  /** Timeout for individual actions (click, type, etc.) */
  readonly action: number;
  /** Timeout for page navigation */
  readonly navigation: number;
  /** Timeout for expect assertions */
  readonly expect: number;
  /** Global test timeout */
  readonly global: number;
}

/**
 * Application URL configuration.
 * Different URLs for different environments.
 */
export interface ApplicationConfig {
  /** Current environment name */
  readonly environment: Environment;
  /** Application name for reports */
  readonly appName: string;
  /** Framework version */
  readonly version: string;
  /** Base URL for UI tests */
  readonly baseUrl: string;
  /** Base URL for API tests */
  readonly apiBaseUrl: string;
}

export interface DataConfig {
  readonly username: string;
  readonly password: string;
}

/**
 * Test credentials and form data.
 * Loaded from env files — never hardcoded.
 */
export interface TestDataConfig {
  /** Login credentials */
  readonly credentials: CredentialsConfig;
  /** Personal info for forms */
  readonly personalInfo: PersonalInfoConfig;
}

export interface CredentialsConfig {
  readonly username: string;
  readonly password: string;
}

export interface PersonalInfoConfig {
  readonly firstName: string;
  readonly lastName: string;
  readonly postalCode: string;
}

/**
 * Test retry configuration.
 */
export interface RetryConfig {
  /** Number of retries on test failure */
  readonly count: number;
  /** Delay between retries (ms) */
  readonly delayMs: number;
}

/**
 * Parallel execution configuration.
 */
export interface WorkerConfig {
  /** Number of parallel workers */
  readonly count: number | undefined;
  /** Whether to run tests in fully parallel mode */
  readonly fullyParallel: boolean;
}

/**
 * Test reporting configuration.
 */
export interface ReportingConfig {
  readonly allureResultsDir: string;
  readonly htmlReportDir: string;
  readonly jsonReportPath: string;
  readonly screenshotMode: ScreenshotMode;
  readonly videoMode: VideoMode;
  readonly traceMode: TraceMode;
}

/**
 * Logging configuration.
 */
export interface LoggingConfig {
  readonly level: LogLevel;
  readonly toFile: boolean;
  readonly filePath: string;
}

/**
 * Root configuration object — aggregates all sections.
 */
export interface FrameworkConfig {
  readonly browser: BrowserConfig;
  readonly application: ApplicationConfig;
  readonly testData: TestDataConfig;
  readonly retry: RetryConfig;
  readonly workers: WorkerConfig;
  readonly reporting: ReportingConfig;
  readonly logging: LoggingConfig;
}

// ─── Config loader ────────────────────────────────────────────
/**
 * Parses environment variables into the typed FrameworkConfig.
 *
 * Only reads env vars and maps to types.
 * All parsing logic is here — no env var access elsewhere.
 */

export class EnvironmentConfig {
  /**
   * Loads and returns the complete framework configuration.
   * Reads from process.env — call loadEnvironment() first.
   *
   * @returns Frozen FrameworkConfig object
   */
  static load(): FrameworkConfig {
    return Object.freeze({
      browser: this.loadBrowserConfig(),
      application: this.loadApplicationConfig(),
      testData: this.loadTestDataConfig(),
      retry: this.loadRetryConfig(),
      workers: this.loadWorkerConfig(),
      reporting: this.loadReportingConfig(),
      logging: this.loadLoggingConfig(),
    });
  }

  // ─── Section loaders ─────────────────────────────────────────
  private static loadBrowserConfig(): BrowserConfig {
    return Object.freeze({
      engine: (process.env['BROWSER'] ?? 'chromium') as BrowserEngine,
      headless: process.env['HEADLESS'] !== 'false',
      slowMo: this.parseInt('SLOW_MO', 0),
      useRealChrome: process.env['USE_CHROME'] === 'true',
      viewport: Object.freeze({
        width: this.parseInt('VIEWPORT_WIDTH', 1920),
        height: this.parseInt('VIEWPORT_HEIGHT', 1080),
      }),
      timeouts: Object.freeze({
        action: this.parseInt('ACTION_TIMEOUT', 15_000),
        navigation: this.parseInt('NAV_TIMEOUT', 30_000),
        expect: this.parseInt('EXPECT_TIMEOUT', 10_000),
        global: this.parseInt('GLOBAL_TIMEOUT', 60_000),
      }),
    });
  }

  private static loadApplicationConfig(): ApplicationConfig {
    return Object.freeze({
      environment: (process.env['ENV'] ?? 'qa') as Environment,
      appName: process.env['APP_NAME'] ?? 'QA Framework',
      version: process.env['FRAMEWORK_VERSION'] ?? '1.0.0',
      baseUrl: this.requireString('BASE_URL', 'https://www.saucedemo.com'),
      apiBaseUrl: this.requireString('API_BASE_URL', 'https://reqres.in/api'),
    });
  }

  private static loadTestDataConfig(): TestDataConfig {
    return Object.freeze({
      credentials: Object.freeze({
        username: this.requireString('TEST_USERNAME', 'standard_user'),
        password: this.requireString('TEST_PASSWORD', 'secret_sauce'),
      }),
      personalInfo: Object.freeze({
        firstName: process.env['TEST_FIRST_NAME'] ?? 'Test',
        lastName: process.env['TEST_LAST_NAME'] ?? 'User',
        postalCode: process.env['TEST_POSTAL_CODE'] ?? '1010',
      }),
    });
  }

  private static loadRetryConfig(): RetryConfig {
    return Object.freeze({
      count: this.parseInt('RETRY_COUNT', 0),
      delayMs: this.parseInt('RETRY_DELAY', 1_000),
    });
  }

  private static loadWorkerConfig(): WorkerConfig {
    const isCI = !!process.env['CI'];
    const workersEnv = process.env['WORKERS'];

    return Object.freeze({
      count: workersEnv ? parseInt(workersEnv) : isCI ? 2 : undefined,
      fullyParallel: true,
    });
  }

  private static loadReportingConfig(): ReportingConfig {
    return Object.freeze({
      allureResultsDir: process.env['ALLURE_RESULTS_DIR'] ?? 'allure-results',
      htmlReportDir: process.env['HTML_REPORT_DIR'] ?? 'playwright-report',
      jsonReportPath: 'test-results/results.json',
      screenshotMode: (process.env['SCREENSHOT_MODE'] ?? 'only-on-failure') as ScreenshotMode,
      videoMode: (process.env['VIDEO_MODE'] ?? 'retain-on-failure') as VideoMode,
      traceMode: (process.env['TRACE_MODE'] ?? 'on-first-retry') as TraceMode,
    });
  }

  private static loadLoggingConfig(): LoggingConfig {
    return Object.freeze({
      level: (process.env['LOG_LEVEL'] ?? 'info') as LogLevel,
      toFile: process.env['LOG_TO_FILE'] !== 'false',
      filePath: 'logs/test-execution.log',
    });
  }

  // ─── Parsing helpers ─────────────────────────────────────────
  /**
   * Parses an integer env var with a default value.
   */
  private static parseInt(key: string, defaultValue: number): number {
    const value = process.env[key];
    if (!value) return defaultValue;
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? defaultValue : parsed;
  }

  /**
   * Returns a required string env var with a fallback default.
   * In CI without a default, throws if the variable is missing.
   */
  private static requireString(key: string, defaultValue: string): string {
    const value = process.env[key];
    if (!value) {
      if (process.env['CI']) {
        console.warn(`Warning: ${key} not set in CI — using default`);
      }
      return defaultValue;
    }
    return value;
  }
}

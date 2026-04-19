/**
 * SINGLE RESPONSIBILITY PRINCIPLE
 *
 * This class has ONE job: manage environment configuration.
 * It does NOT run tests, does NOT create browsers, does NOT log anything.
 * If config logic changes → only this file changes.
 */

export interface BrowserConfig {
  readonly type: string;
  readonly headless: boolean;
  readonly viewport: { width: number; height: number };
  readonly actionTimeout: number;
  readonly navigationTimeout: number;
}

export interface ApplicationConfig {
  readonly baseUrl: string;
  readonly apiBaseUrl: string;
  readonly environment: string;
}

export interface DataConfig {
  readonly username: string;
  readonly password: string;
}

export interface Reporting {
  readonly allureResultDir: string;
  readonly htmlReportDir: string;
}

export interface FrameworkConfig {
  readonly browser: BrowserConfig;
  readonly application: ApplicationConfig;
  readonly testData: DataConfig;
  readonly reporting: Reporting;
}

export class EnvironmentConfig {
  private static readonly DEFAULT_VIEWPORT = { width: 1920, height: 1080 };

  static load(): FrameworkConfig {
    return {
      browser: {
        type: process.env['BROWSER'] ?? 'chromium',
        headless: process.env['HEADLESS'] !== 'false',
        viewport: this.DEFAULT_VIEWPORT,
        actionTimeout: parseInt(process.env['ACTION_TIMEOUT'] ?? '15000'),
        navigationTimeout: parseInt(process.env['NAV_TIMEOUT'] ?? '30000'),
      },
      application: {
        baseUrl: process.env['BASE_URL'] ?? 'https://www.saucedemo.com',
        apiBaseUrl: process.env['API_BASE_URL'] ?? 'https://reqres.in/api',
        environment: process.env['ENV'] ?? 'qa',
      },
      testData: {
        username: process.env['TEST_USERNAME'] ?? 'standard_user',
        password: process.env['TEST_PASSWORD'] ?? 'secret_sauce',
      },
      reporting: {
        allureResultDir: process.env['ALLURE_RESULTS_DIR'] ?? 'allure-results',
        htmlReportDir: 'playwright-report',
      },
    };
  }
}

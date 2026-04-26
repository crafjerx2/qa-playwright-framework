/**
 * @fileoverview Playwright configuration driven by ConfigManager.
 *
 * All values come from environment variables via ConfigManager.
 * No hardcoded values — fully driven by .env files.
 */

import { defineConfig, devices } from '@playwright/test';
import { loadEnvironment } from '@config/EnvLoader';
import { EnvironmentConfig } from '@config/EnvironmentConfig';

// Load environment FIRST — before anything else reads process.env
loadEnvironment();
const config = EnvironmentConfig.load();

export default defineConfig({
  // Test Directory
  testDir: './tests',
  // Run test in paralel
  fullyParallel: config.workers.fullyParallel,
  workers: config.workers.count,
  // Fail the build on CI if test.only is accidentally commited
  forbidOnly: !!process.env['CI'],
  // Retry Failled tests
  retries: config.retry.count,
  // Global timeout per test
  timeout: config.browser.timeouts.global,
  // Expect timeout for assertions
  expect: { timeout: config.browser.timeouts.expect },
  // Global setup and teardown
  globalSetup: './src/fixtures/globalSetup.ts',
  globalTeardown: './src/fixtures/globalTeardown.ts',
  // Reporter configuration
  reporter: [
    // Custom reporter — our own
    ['./src/reporting/CustomReporter.ts'],

    // Playwright HTML — detailed visual report
    [
      'html',
      {
        outputFolder: config.reporting.htmlReportDir,
        open: 'never',
        host: 'localhost',
        port: 9323,
      },
    ],

    // Allure — advanced analytics dashboard
    [
      'allure-playwright',
      {
        outputFolder: config.reporting.allureResultsDir,
        suiteTitle: false,
        environmentInfo: {
          Environment: config.application.environment,
          Browser: config.browser.engine,
          BaseUrl: config.application.baseUrl,
          Framework: 'Playwright + TypeScript',
          NodeVersion: process.version,
        },
      },
    ],
    // JSON — for CI integration
    ['json', { outputFile: config.reporting.jsonReportPath }],

    // JUnit XML — for Azure DevOps / Jenkins
    ['junit', { outputFile: 'test-results/junit-results.xml' }],

    // List — minimal console output (used by CustomReporter)
    process.env['CI'] ? ['dot'] : ['list'],
  ],

  // Global test configuration
  use: {
    // Base URL for all test
    baseURL: config.application.apiBaseUrl,
    // Browser options
    headless: config.browser.headless,
    // Viewpor
    viewport: config.browser.viewport,
    // Action timweout
    actionTimeout: config.browser.timeouts.action,
    // Navigation timeout
    navigationTimeout: config.browser.timeouts.navigation,
    // Screenshot on failure
    screenshot: config.reporting.screenshotMode,
    // Video on failure
    video: config.reporting.videoMode,
    // Trace on retry
    trace: config.reporting.traceMode,
    // Ignore Https Error
    ignoreHTTPSErrors: true,
    // Tell Playwright which attribute to use for getByTestId()
    testIdAttribute: 'data-test',
  },

  // Multi-browser projects
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        channel: config.browser.useRealChrome ? 'chrome' : undefined,
      },
      testMatch: ['**/ui/**', '**/e2e/**'],
    },

    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        actionTimeout: 20_000,
        navigationTimeout: 45_000,
      },
      testMatch: ['**/ui/**'],
      fullyParallel: false,
    },

    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        actionTimeout: 20_000,
        navigationTimeout: 45_000,
      },
      testMatch: ['**/ui/**'],
      fullyParallel: false,
    },
    // Mobile testing
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
      testMatch: '**/mobile/**',
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 13'] },
      testMatch: ['**/mobile/**'],
    },

    // API tests - no browser needed
    {
      name: 'api',
      testDir: './tests/api',
      use: {
        baseURL: config.application.apiBaseUrl,
        extraHTTPHeaders: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      },
    },
  ],

  // Output folder for test artifacts
  outputDir: 'test-results/',
});

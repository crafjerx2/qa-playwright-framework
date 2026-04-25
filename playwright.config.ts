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
  reporter: [['list', { printSteps: true }]],

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
      use: { ...devices['Desktop Firefox'] },
      testMatch: ['**/ui/**'],
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      testMatch: ['**/ui/**'],
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

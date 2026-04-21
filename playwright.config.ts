import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

export default defineConfig({
  // Test Directory
  testDir: './tests',
  // Run test in paralel
  fullyParallel: true,
  // Fail the build on CI if test.only is accidentally commited
  forbidOnly: !!process.env.CI,
  // Retry Failled tests
  retries: process.env.CI ? 2 : 0,
  // Number of parallel workers
  workers: process.env.CI ? 1 : undefined,
  // Global timeout per test
  timeout: 30_000,
  // Expect timeout for assertions
  expect: { timeout: 10_000 },
  // Global setup and teardown
  globalSetup: './src/fixtures/globalSetup.ts',
  globalTeardown: './src/fixtures/globalTeardown.ts',
  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
    ['allure-playwright', { outputFolder: 'allure-results' }],
    ['json', { outputFolder: 'test-results/result.json' }],
  ],

  // Global test configuration
  use: {
    // Base URL for all test
    baseURL: process.env['BASE_URL'] ?? 'https://www.saucedemo.com',
    // Browser options
    headless: process.env['HEADLESS'] != 'false',
    // Screenshot on failure
    screenshot: 'only-on-failure',
    // Video on failure
    video: 'retain-on-failure',
    // Trace on retry
    trace: 'on-first-retry',
    // Viewport
    viewport: { width: 1920, height: 1080 },
    // Action timweout
    actionTimeout: 15_000,
    // Navigation timeout
    navigationTimeout: 30_000,
    // Ignore Https Error
    ignoreHTTPSErrors: true,
  },

  // Multi-browser projects
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    // Mobile testing
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
      testMatch: '**/mobile/**',
    },
    // API tests - no browser needed
    {
      name: 'api',
      testDir: './tests/api',
      use: {
        baseURL: process.env['API_BASE_URL'] ?? 'https://reqres.in/api',
      },
    },
  ],

  // Output folder for test artifacts
  outputDir: 'test-results/',
});

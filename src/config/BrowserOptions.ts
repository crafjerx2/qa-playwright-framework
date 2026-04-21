/**
 * @fileoverview Browser configuration options for multi-browser support.
 *
 * @description
 * Centralizes all browser-specific options in one place.
 * Following Open/Closed Principle — add new browsers without
 * modifying existing code.
 *
 * ## Design Pattern: Strategy
 * Each browser has its own options strategy.
 * BrowserOptionsFactory selects the right strategy at runtime.
 *
 * @example
 * const options = BrowserOptionsFactory.getOptions('firefox');
 */

import { LaunchOptions, BrowserContextOptions, devices } from '@playwright/test';

/**
 * Supported browser types in the framework.
 * Maps to Playwright's browser engine names.
 */
export type BrowserType = 'chromium' | 'firefox' | 'webkit';

/**
 * Supported device profiles for mobile testing.
 */
export type DeviceProfile = 'desktop' | 'mobile-chrome' | 'mobile-safari' | 'tablet';

/**
 * Complete browser configuration including
 * launch options and context options.
 */
export interface BrowserConfig {
  /** Options passed to browser.launch() */
  launchOptions: LaunchOptions;
  /** Options passed to browser.newContext() */
  contextOptions: BrowserContextOptions;
}

/**
 * @class BrowserOptionsFactory
 * @description Factory that creates browser-specific configurations.
 *
 * FACTORY PATTERN: Creates the right config without exposing logic.
 * OPEN/CLOSED: New browsers added as new methods, existing unchanged.
 */
export class BrowserOptionsFactory {
  private static readonly IS_CI = !!process.env['CI'];
  private static readonly HEADLESS = process.env['HEADLESS'] !== 'false';

  /**
   * Returns browser configuration for the given browser type.
   *
   * @param browserType - Target browser engine
   * @param device - Device profile for viewport and user agent
   * @returns Complete browser configuration object
   */
  static getConfig(
    browserType: BrowserType = 'chromium',
    device: DeviceProfile = 'desktop',
  ): BrowserConfig {
    const launchOptions = this.getLaunchOptions(browserType);
    const contextOptions = this.getContextOptions(browserType, device);
    return { launchOptions, contextOptions };
  }

  // ─── Launch Options per browser ──────────────────────────────

  /**
   * Returns launch options for the specified browser.
   * Each browser has its own optimized arguments.
   */
  private static getLaunchOptions(browserType: BrowserType): LaunchOptions {
    const baseOptions: LaunchOptions = {
      headless: this.HEADLESS,
      slowMo: this.IS_CI ? 0 : 0,
    };

    switch (browserType) {
      case 'chromium':
        return {
          ...baseOptions,
          args: [
            '--no-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-extensions',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
            // Remove automation detection
            '--disable-blink-features=AutomationControlled',
          ],
          // Use channel for real Chrome if available
          channel: process.env['USE_CHROME'] ? 'chrome' : undefined,
        };

      case 'firefox':
        return {
          ...baseOptions,
          firefoxUserPrefs: {
            // Disable Firefox update checks in CI
            'app.update.auto': false,
            'browser.tabs.remote.autostart': false,
            // Disable telemetry
            'toolkit.telemetry.enabled': false,
            'browser.ping-centre.telemetry': false,
          },
        };

      case 'webkit':
        return {
          ...baseOptions,
          // WebKit has minimal launch args
        };

      default: {
        const _exhaustive: never = browserType;
        throw new Error(`Unsupported browser: ${String(_exhaustive)}`);
      }
    }
  }

  // ─── Context Options per device ──────────────────────────────

  /**
   * Returns context options for the specified device profile.
   * Context options control viewport, locale, timezone, etc.
   */
  private static getContextOptions(
    _browserType: BrowserType,
    device: DeviceProfile,
  ): BrowserContextOptions {
    const baseContext: BrowserContextOptions = {
      locale: 'en-NZ',
      timezoneId: 'Pacific/Auckland',
      ignoreHTTPSErrors: true,
      // Record video in CI
      recordVideo: this.IS_CI ? { dir: 'test-results/videos' } : undefined,
    };

    switch (device) {
      case 'desktop':
        return {
          ...baseContext,
          viewport: { width: 1920, height: 1080 },
          colorScheme: 'light',
        };

      case 'mobile-chrome':
        return {
          ...baseContext,
          ...devices['Pixel 5'],
          // Override locale for NZ
          locale: 'en-NZ',
        };

      case 'mobile-safari':
        return {
          ...baseContext,
          ...devices['iPhone 13'],
          locale: 'en-NZ',
        };

      case 'tablet':
        return {
          ...baseContext,
          ...devices['iPad Pro 11'],
          locale: 'en-NZ',
        };

      default: {
        const _exhaustive: never = device;
        throw new Error(`Unsupported device: ${String(_exhaustive)}`);
      }
    }
  }

  /**
   * Returns context options specifically for API testing.
   * No viewport needed — just headers and auth setup.
   */
  static getApiContextOptions(token?: string): BrowserContextOptions {
    return {
      baseURL: process.env['API_BASE_URL'] ?? 'https://reqres.in/api',
      extraHTTPHeaders: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ignoreHTTPSErrors: true,
    };
  }
}

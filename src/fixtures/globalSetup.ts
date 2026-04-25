/**
 * @fileoverview Global setup — runs ONCE before all tests.
 *
 * @description
 * Performs expensive operations once:
 * - Login and save auth state
 * - Create shared test data
 * - Verify the application is reachable
 *
 * ## Why Global Setup?
 * Without it: 50 tests × 2s login = 100 seconds wasted logging in.
 * With it: Login once = 2 seconds total.
 *
 * ## Auth State Flow:
 * globalSetup → login → saveAuthState → tests use saved state
 */
import { BrowserManager } from './BrowserManager';
import { LoginPage } from '@pages/login/LoginPage';
import { Config } from '@config/ConfigManager';
import { ConfigValidator } from '@config/ConfigValidator';

export const AUTH_STATE_PATH = '.auth/user.json';

async function globalSetup(): Promise<void> {
  // Validate config FIRST — fail fast if misconfigured
  ConfigValidator.validate(Config.settings);

  // Print config summary for CI logs
  if (Config.isCI) {
    Config.printConfig();
  }

  const browser = await BrowserManager.launchBrowser('chromium');
  const context = await BrowserManager.createContext(browser);
  const page = await BrowserManager.createPage(context);

  try {
    // Login once and save the session
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await loginPage.login(Config.testUsername, Config.testPassword);

    // Verify we are authenticated
    const url = loginPage.getCurrentUrl();
    if (!url.includes('inventory')) {
      throw new Error('Global setup: Login failed — not on inventory page');
    }

    // Save auth state for reuse across tests
    await BrowserManager.saveAuthState(context, AUTH_STATE_PATH);

    // TestLogger.config('Global setup: auth state saved successfully');
  } catch (error) {
    //TestLogger.config(`Global setup FAILED: ${String(error)}`);
    throw error;
  } finally {
    await BrowserManager.closeContext(context);
    await BrowserManager.closeBrowser(browser);
    //TestLogger.config('=== Global Setup Complete ===');
  }
}

export default globalSetup;

/**
 * @fileoverview Browser lifecycle management for the test framework.
 *
 * @description
 * BrowserManager handles the creation, configuration, and cleanup
 * of Playwright browsers and browser contexts.
 *
 * ## Why BrowserManager?
 * Playwright fixtures handle WHEN browsers are created/destroyed.
 * BrowserManager handles HOW they are configured.
 *
 * ## Context Isolation
 * Each test gets a FRESH browser context — isolated state.
 * This means:
 * - Cookies are cleared between tests
 * - LocalStorage is cleared between tests
 * - No state leaks between tests
 * - Tests can run in parallel safely
 * *
 * // Playwright — context isolation is automatic
 * // Each test gets a fresh context via fixtures
 * ```
 */
import { Browser, BrowserContext, Page, chromium, firefox, webkit } from '@playwright/test';
import { BrowserType, DeviceProfile, BrowserOptionsFactory } from '@config/BrowserOptions';
import { TestLogger } from '@utils/Logger';
import * as fs from 'fs';

/**
 * State stored per browser context.
 * Used for debugging and reporting.
 */
interface ContextState {
  readonly contextId: string;
  readonly browserType: BrowserType;
  readonly device: DeviceProfile;
  readonly createdAt: Date;
  pageCount: number;
}

/**
 * @class BrowserManager
 * @description Manages browser and context lifecycle.
 *
 * SINGLE RESPONSIBILITY: Only manages browser/context lifecycle.
 * FACTORY PATTERN: Creates browsers via static factory methods.
 */
export class BrowserManager {
  private static contextRegistry = new Map<string, ContextState>();
  private static contextCounter = 0;

  // ─── Browser creation ────────────────────────────────────────

  /**
   * Launches a browser of the specified type.
   *
   * @param browserType - Browser engine to launch
   * @returns Promise resolving to a launched Browser instance
   *
   * @example
   * const browser = await BrowserManager.launchBrowser('firefox');
   */
  static async launchBrowser(browserType: BrowserType = 'chromium'): Promise<Browser> {
    const { launchOptions } = BrowserOptionsFactory.getConfig(browserType);

    console.log(`Launching browser: ${browserType}`);

    switch (browserType) {
      case 'chromium':
        return chromium.launch(launchOptions);
      case 'firefox':
        return firefox.launch(launchOptions);
      case 'webkit':
        return webkit.launch(launchOptions);
      default: {
        const _exhaustive: never = browserType;
        throw new Error(`Unsupported browser: ${String(_exhaustive)}`);
      }
    }
  }

  // ─── Context creation ────────────────────────────────────────
  /**
   * Creates an isolated browser context with the specified configuration.
   *
   * CONTEXT ISOLATION:
   * Each context is completely isolated — separate cookies, storage,
   * cache. Running multiple tests with separate contexts means they
   * cannot interfere with each other.
   *
   * @param browser - The browser instance to create a context in
   * @param browserType - Browser type (for logging)
   * @param device - Device profile for viewport configuration
   * @returns Promise resolving to a configured BrowserContext
   */
  static async createContext(
    browser: Browser,
    browserType: BrowserType = 'chromium',
    device: DeviceProfile = 'desktop',
  ): Promise<BrowserContext> {
    const { contextOptions } = BrowserOptionsFactory.getConfig(browserType, device);

    const context = await browser.newContext(contextOptions);
    const contextId = `ctx-${++this.contextCounter}`;

    // Register context for tracking
    this.contextRegistry.set(contextId, {
      contextId,
      browserType,
      device,
      createdAt: new Date(),
      pageCount: 0,
    });

    console.log(`Context created: ${contextId} [${browserType}/${device}]`);

    return context;
  }

  /**
   * Creates a browser context pre-configured for API testing.
   * No viewport — optimized for HTTP requests only.
   *
   * @param browser - Browser instance
   * @param token - Optional auth token to include in headers
   */
  static async createApiContext(browser: Browser, token?: string): Promise<BrowserContext> {
    const contextOptions = BrowserOptionsFactory.getApiContextOptions(token);
    const context = await browser.newContext(contextOptions);
    console.log('API context created');
    return context;
  }

  /**
   * Creates a context with saved authentication state.
   * Avoids logging in before every test.
   *
   * PERFORMANCE OPTIMIZATION:
   * Login once → save state → reuse state across tests.
   * Much faster than logging in before each test.
   *
   * @param browser - Browser instance
   * @param storageStatePath - Path to the saved auth state JSON file
   */
  static async createAuthenticatedContext(
    browser: Browser,
    storageStatePath: string,
  ): Promise<BrowserContext> {
    TestLogger.step(`Creating authenticated context from: ${storageStatePath}`);

    // Verify the file exists and is valid JSON before using it
    try {
      const content = fs.readFileSync(storageStatePath, 'utf-8');
      JSON.parse(content);
    } catch {
      TestLogger.warn('Auth state file invalid — creating fresh context');
      return BrowserManager.createContext(browser);
    }

    const { contextOptions } = BrowserOptionsFactory.getConfig('chromium');
    try {
      return await browser.newContext({
        ...contextOptions,
        storageState: storageStatePath,
      });
    } catch (error) {
      TestLogger.warn(`Storage state failed: ${String(error)} — using fresh context`);
      return BrowserManager.createContext(browser);
    }
  }

  // ─── Page creation ───────────────────────────────────────────

  /**
   * Creates a new page within a context.
   * Configures default timeouts from environment config.
   *
   * @param context - Browser context to open the page in
   * @returns Promise resolving to a configured Page
   */
  static async createPage(context: BrowserContext): Promise<Page> {
    const page = await context.newPage();

    // Set default timeouts
    page.setDefaultTimeout(parseInt(process.env['ACTION_TIMEOUT'] ?? '15000'));
    page.setDefaultNavigationTimeout(parseInt(process.env['NAV_TIMEOUT'] ?? '30000'));
    return page;
  }

  // ─── Auth state management ───────────────────────────────────

  /**
   * Saves the current browser context authentication state to a file.
   * Use this after logging in to reuse auth state across tests.
   *
   * @param context - Authenticated browser context
   * @param filePath - Where to save the state JSON
   *
   * @example
   * // In global setup:
   * await loginPage.login(user, pass);
   * await BrowserManager.saveAuthState(context, './auth/state.json');
   *
   * // In tests: use createAuthenticatedContext() to reuse it
   */
  static async saveAuthState(
    context: BrowserContext,
    filePath: string = '.auth/state.json',
  ): Promise<void> {
    const fs = await import('fs');
    const path = await import('path');

    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    await context.storageState({ path: filePath });
    //TestLogger.config(`Auth state saved to: ${filePath}\n`);
  }

  // ─── Cleanup ─────────────────────────────────────────────────

  /**
   * Safely closes a browser context and removes it from the registry.
   *
   * @param context - Context to close
   */
  static async closeContext(context: BrowserContext): Promise<void> {
    try {
      await context.close();
      //TestLogger.config('Browser context closed');
    } catch (error) {
      console.warn(`Warning: error closing context: ${String(error)}`);
    }
  }

  /**
   * Safely closes a browser instance.
   *
   * @param browser - Browser to close
   */
  static async closeBrowser(browser: Browser): Promise<void> {
    try {
      await browser.close();
      //TestLogger.config('Browser closed');
    } catch (error) {
      console.log(`Warning: error closing browser: ${String(error)}`);
    }
  }

  // ─── Debug utilities ─────────────────────────────────────────

  /**
   * Returns a summary of all active contexts.
   * Useful for debugging resource leaks.
   */
  static getContextSummary(): ContextState[] {
    return Array.from(this.contextRegistry.values());
  }

  /**
   * Clears the context registry.
   * Call at the end of a test session.
   */
  static clearRegistry(): void {
    this.contextRegistry.clear();
    this.contextCounter = 0;
  }
}

/**
 * @fileoverview Custom Playwright fixtures with full browser management.
 *
 * @description
 * Fixtures are Playwright's dependency injection system.
 * They replace manual [SetUp]/[TearDown] methods.
 *
 * ## Fixture Scopes:
 * - 'test' (default): Created fresh for each test
 * - 'worker': Shared across tests in the same worker
 *
 * ## Context Isolation:
 * Each test fixture creates its own BrowserContext.
 * This means complete isolation — no shared cookies or storage.
 *
 * ## Usage in tests:
 * ```typescript
 * import { test, expect } from '../../src/fixtures';
 *
 * test('my test', async ({ loginPage, standardUser }) => {
 *   await loginPage.login(standardUser.username, standardUser.password);
 * });
 * ```
 */

import { test as base, BrowserContext, Page } from '@playwright/test';
import { LoginPage } from '../pages/login/LoginPage';
import { InventoryPage } from '../pages/inventory/InventoryPage';
import { PageFactory } from './PageFactory';
import { BrowserManager } from './BrowserManager';
import { Config } from '../config/ConfigManager';
import { TestLogger } from '../utils/Logger';
import { UserBuilder, TestUser } from '../data/factories/UserBuilder';
import { BrowserType, DeviceProfile } from '../config/BrowserOptions';
import { AUTH_STATE_PATH } from './globalSetup';
import * as fs from 'fs';
import { ScreenshotHelper } from '@utils/ScreenshotHelper';
import { ReportManager } from '../reporting/ReportManager';

// ─── Fixture type definitions ─────────────────────────────────

interface BrowserFixtures {
  /** Current browser type from environment or test config */
  browserType: BrowserType;
  /** Current device profile */
  deviceProfile: DeviceProfile;
  /** Fresh isolated browser context per test */
  isolatedContext: BrowserContext;
  /** Authenticated browser context (reuses saved auth state) */
  authenticatedContext: BrowserContext;
  /** Page from isolated context */
  isolatedPage: Page;
}

interface PageFixtures {
  /** PageFactory for creating page objects */
  pageFactory: PageFactory;
  /** Fresh LoginPage — navigated to login URL */
  loginPage: LoginPage;
  /** InventoryPage — NOT pre-authenticated */
  inventoryPage: InventoryPage;
  /** InventoryPage — pre-authenticated via saved state */
  authenticatedInventoryPage: InventoryPage;
}

interface DataFixtures {
  /** Standard SauceDemo user */
  standardUser: TestUser;
  /** Locked-out SauceDemo user */
  lockedUser: TestUser;
  /** Problem SauceDemo user */
  problemUser: TestUser;
  /** Random invalid user */
  randomUser: TestUser;
}

type AllFixtures = BrowserFixtures & PageFixtures & DataFixtures;

//Env variables
const browserName = process.env['BROWSER'] ?? 'chromium';
const deviceName = process.env['DEVICE'] ?? 'desktop';

// ─── Extended test with custom fixtures ──────────────────────

export const test = base.extend<AllFixtures>({
  // ─── Browser fixtures ───────────────────────────────────────

  browserType: async ({}, use) => {
    await use(browserName as BrowserType);
  },

  deviceProfile: async ({}, use) => {
    await use(deviceName as DeviceProfile);
  },

  /**
   * Fresh isolated context per test.
   * CONTEXT ISOLATION: Complete fresh state — no cookies, no storage.
   */
  isolatedContext: async ({ browser, browserType, deviceProfile }, use) => {
    const context = await BrowserManager.createContext(browser, browserType, deviceProfile);
    await use(context);

    // Cleanup — always runs even if test fails
    await BrowserManager.closeContext(context);
  },

  /**
   * Authenticated context — reuses saved login state.
   * Much faster than logging in before each test.
   */
  authenticatedContext: async ({ browser }, use) => {
    const authStateExists = fs.existsSync(AUTH_STATE_PATH);

    const context = authStateExists
      ? await BrowserManager.createAuthenticatedContext(browser, AUTH_STATE_PATH)
      : await BrowserManager.createContext(browser);

    await use(context);
    await BrowserManager.closeContext(context);
  },

  /**
   * Page from isolated context.
   * Use when you need a completely fresh browser state.
   */
  isolatedPage: async ({ isolatedContext }, use) => {
    const page = await BrowserManager.createPage(isolatedContext);
    await use(page);
  },

  // ─── Page Object fixtures ────────────────────────────────────

  pageFactory: async ({ page }, use) => {
    await use(new PageFactory(page));
  },

  /**
   * LoginPage fixture — navigates to login before test.
   * Uses the default Playwright 'page' fixture (isolated per test).
   */
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await use(loginPage);
  },

  /**
   * InventoryPage — not pre-authenticated.
   * Use when you want to test unauthenticated access.
   */
  inventoryPage: async ({ page }, use) => {
    await use(new InventoryPage(page));
  },

  /**
   * Authenticated InventoryPage.
   * Uses saved auth state for speed.
   * Falls back to full login if auth state doesn't exist.
   */
  authenticatedInventoryPage: async ({ browser, page: _page }, use, testInfo) => {
    TestLogger.testStart(testInfo.title);

    // Add test metadata to report
    ReportManager.addDescription(
      testInfo,
      `Environment: ${Config.environment} | Browser: ${Config.browserEngine}`,
    );

    const authStateExists = fs.existsSync(AUTH_STATE_PATH);
    const context = authStateExists
      ? await BrowserManager.createAuthenticatedContext(browser, AUTH_STATE_PATH)
      : await BrowserManager.createContext(browser);

    const page = await BrowserManager.createPage(context);
    const factory = new PageFactory(page);

    let inventoryPage: InventoryPage;
    try {
      // Try to use saved auth state
      const inventory = factory.createInventoryPage();
      await inventory.navigate();
      const loaded = await inventory.isLoaded();

      inventoryPage = loaded
        ? inventory
        : await factory.createAuthenticatedInventoryPage(Config.testUsername, Config.testPassword);
    } catch {
      // If anything fails, do full login
      inventoryPage = await factory.createAuthenticatedInventoryPage(
        Config.testUsername,
        Config.testPassword,
      );
    }

    await use(inventoryPage);

    // ─── Teardown with reporting ──────────────────────────────

    // Capture screenshot on failure
    if (testInfo.status !== 'passed') {
      await ScreenshotHelper.captureOnFailure(page, testInfo);

      // Get video path if recorded
      const videoPath = await ScreenshotHelper.getVideoPath(page);
      if (videoPath) {
        TestLogger.video(videoPath);
      }

      TestLogger.testFail(testInfo.title, testInfo.error?.message ?? 'Unknown');
    } else {
      TestLogger.testPass(testInfo.title, testInfo.duration);
    }

    await BrowserManager.closeContext(context);
  },

  // ─── Test data fixtures ──────────────────────────────────────
  standardUser: async ({}, use) => {
    await use(UserBuilder.standard().build());
  },
  lockedUser: async ({}, use) => {
    await use(UserBuilder.locked().build());
  },
  problemUser: async ({}, use) => {
    await use(UserBuilder.locked().asProblemUser().build());
  },
  randomUser: async ({}, use) => {
    await use(UserBuilder.random().build());
  },
});

export { expect } from '@playwright/test';

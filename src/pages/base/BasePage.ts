/**
 * @fileoverview Base class for all Page Objects in the framework.
 *
 * @description
 * BasePage implements the Template Method design pattern,
 * providing a skeleton of common page operations while deferring
 * specific behavior to subclasses.
 *
 * ## Design Patterns Applied
 * - **Template Method**: `waitForLoad()` calls abstract `isLoaded()`
 * - **Facade**: Simplifies Playwright's API for subclasses
 *
 * ## SOLID Principles
 * - **S** - Single Responsibility: manages page interactions only
 * - **O** - Open/Closed: extend via inheritance, never modify
 * - **L** - Liskov: subclasses honor this contract
 *
 * @example
 * // Creating a new page that extends BasePage:
 * class CheckoutPage extends BasePage {
 *   async isLoaded(): Promise<boolean> {
 *     return this.isVisible(this.continueButton);
 *   }
 * }
 */

import { Page, Locator, expect } from '@playwright/test';
import { IBasePage, IPageLoadable } from './interfaces';
import { EnvironmentConfig } from '@config/EnvironmentConfig';
import { TestLogger } from '@utils/Logger';
import { Timeouts } from '@config/Constants';

export abstract class BasePage implements IBasePage, IPageLoadable {
  /**
   * The Playwright Page instance.
   * Public to satisfy IBasePage contract.
   * Use in subclasses via `this.page`.
   */
  readonly page: Page;
  /**
   * Loaded once per instance — Single Responsibility for config access.
   */
  protected readonly config = EnvironmentConfig.load();
  /**
   * Base URL from environment configuration.
   * Subclasses use this to build full URLs.
   */
  protected readonly baseUrl: string;

  /**
   * @param page - Playwright Page instance injected via fixtures
   */
  constructor(page: Page) {
    this.page = page;
    this.baseUrl = this.config.application.baseUrl;
  }

  /**
   * Abstract method — each subclass defines its own load condition.
   *
   * Template Method Pattern:
   * `waitForLoad()` calls this method — subclasses define the condition.
   *
   * @returns Promise resolving to true if the page is fully loaded
   *
   * @example
   * // In LoginPage:
   * async isLoaded(): Promise<boolean> {
   *   return this.isVisible(this.loginLogo);
   * }
   */
  abstract isLoaded(): Promise<boolean>;

  /**
   * Waits for the page to be fully loaded.
   * Uses `isLoaded()` as the success condition.
   *
   * @throws Error if page does not load within the timeout
   */
  async waitForLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
    const loaded = await this.isLoaded();
    if (!loaded) {
      throw new Error(`Page ${this.constructor.name} did not load correctly`);
    }
  }

  /**
   * Returns the current page title from the browser tab.
   * @returns Promise resolving to the page title string
   */
  getTitle(): Promise<string> {
    return this.page.title();
  }

  /**
   * Returns the current full URL.
   * @returns Promise resolving to the current URL string
   */
  getCurrentUrl(): string {
    return this.page.url();
  }

  /**
   * Gets the inner text of an element.
   *
   * @param locator - Playwright Locator to get text from
   * @returns Promise resolving to the element's inner text
   */
  protected async getText(locator: Locator): Promise<string> {
    await locator.waitFor({ state: 'visible', timeout: Timeouts.DEFAULT });
    return locator.innerText();
  }

  /**
   * Navigates to a URL path relative to the base URL.
   * If the path starts with 'http', it is used as-is.
   *
   * @param path - Relative path (e.g., '/inventory.html') or full URL
   *
   * @example
   * await this.navigateTo('/checkout-step-one.html');
   * await this.navigateTo('https://external-site.com');
   */
  protected async navigateTo(path: string = ''): Promise<void> {
    const url = path.startsWith('http') ? path : `${this.baseUrl}${path}`;
    TestLogger.step(`Navigating to: ${url}`);
    await this.page.goto(url);
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Clicks an element after waiting for it to be visible.
   * Safer than calling `.click()` directly — handles timing.
   *
   * @param locator - Playwright Locator to click
   */
  protected async clickElement(locator: Locator): Promise<void> {
    await locator.waitFor({ state: 'visible', timeout: Timeouts.DEFAULT });
    await locator.click();
  }

  /**
   * Types text into an input field.
   * Clears the field first to avoid appending to existing content.
   *
   * @param locator - Playwright Locator for the input field
   * @param text - Text to type into the field
   */
  protected async typeText(locator: Locator, text: string): Promise<void> {
    await locator.waitFor({ state: 'visible', timeout: Timeouts.DEFAULT });
    await locator.clear();
    await locator.fill(text);
  }

  /**
   * Checks if an element is visible without throwing on failure.
   * Returns false if the element is not found or not visible.
   *
   * @param locator - Playwright Locator to check
   * @returns Promise resolving to true if visible, false otherwise
   */
  protected async isVisible(locator: Locator): Promise<boolean> {
    try {
      await locator.waitFor({ state: 'visible', timeout: Timeouts.SHORT });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Asserts that an element contains the specified text.
   * Uses Playwright's built-in retry mechanism.
   *
   * @param locator - Element to check
   * @param text - Expected text content
   */
  protected async assertContainsText(locator: Locator, text: string): Promise<void> {
    await expect(locator).toContainText(text, { timeout: Timeouts.DEFAULT });
  }

  /**
   * Asserts that an element is visible on the page.
   *
   * @param locator - Element to check
   */
  protected async assertVisible(locator: Locator): Promise<void> {
    await expect(locator).toBeVisible({ timeout: Timeouts.DEFAULT });
  }

  /**
   * Waits for the current URL to contain the specified string.
   *
   * @param urlPart - Partial URL string to wait for
   *
   * @example
   * await this.waitForUrl('inventory');
   */
  protected async waitForUrl(urlPart: string): Promise<void> {
    await this.page.waitForURL(`**/${urlPart}**`, {
      timeout: Timeouts.DEFAULT,
    });
  }

  /**
   * Asserts that an element is hidden or not present.
   *
   * @param locator - Element to check
   */
  protected async assertHidden(locator: Locator): Promise<void> {
    await expect(locator).toBeHidden({ timeout: Timeouts.DEFAULT });
  }

  /**
   * Takes a full-page screenshot and saves it to test-results/screenshots.
   *
   * @param name - Base name for the screenshot file
   * @returns Promise resolving to the screenshot as a Buffer
   */
  async takeScreenshot(name: string): Promise<Buffer> {
    TestLogger.step(`Taking screenshot: ${name}`);
    return this.page.screenshot({
      fullPage: true,
      path: `test-results/screenshots/${name}-${Date.now()}.png`,
    });
  }
}

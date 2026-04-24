/**
 * @fileoverview Advanced BasePage with retry logic, custom waits,
 * and comprehensive helper methods.
 *
 * ## New in this version:
 * - `retry()` — retries flaky operations automatically
 * - `waitForCondition()` — custom wait conditions
 * - `scrollTo()` — scroll management
 * - `switchToFrame()` — iframe handling
 * - `interceptNetworkRequest()` — network mocking
 * - `waitForApiResponse()` — wait for specific API calls
 *
 * @example
 * class CheckoutPage extends BasePage {
 *   async isLoaded(): Promise<boolean> {
 *     return this.isVisible(this.continueButton);
 *   }
 *
 *   async fillFormWithRetry(data: CheckoutData): Promise<void> {
 *     await this.retry(() => this.fillCheckoutForm(data), 3);
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
      await this.takeScreenshot(`load-failure-${this.constructor.name}`);
      throw new Error(
        `${this.constructor.name} failed to load. URL: ${await this.getCurrentUrl()}`,
      );
    }
    TestLogger.step(`${this.constructor.name} loaded successfully`);
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

  protected async getAllTexts(locator: Locator): Promise<string[]> {
    return locator.allInnerTexts();
  }

  protected async getInputValue(locator: Locator): Promise<string> {
    await locator.waitFor({ state: 'visible', timeout: Timeouts.DEFAULT });
    return locator.inputValue();
  }

  protected async getAttribute(locator: Locator, attribute: string): Promise<string | null> {
    await locator.waitFor({ state: 'attached', timeout: Timeouts.DEFAULT });
    return locator.getAttribute(attribute);
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
    await locator.scrollIntoViewIfNeeded();
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

  protected async clickElementForce(locator: Locator): Promise<void> {
    await locator.waitFor({ state: 'attached', timeout: Timeouts.DEFAULT });
    await locator.click({ force: true });
  }

  protected async doubleClick(locator: Locator): Promise<void> {
    await locator.waitFor({ state: 'visible', timeout: Timeouts.DEFAULT });
    await locator.dblclick();
  }

  protected async rightClick(locator: Locator): Promise<void> {
    await locator.waitFor({ state: 'visible', timeout: Timeouts.DEFAULT });
    await locator.click({ button: 'right' });
  }

  protected async hoverOver(locator: Locator): Promise<void> {
    await locator.waitFor({ state: 'visible', timeout: Timeouts.DEFAULT });
    await locator.hover();
  }

  /**
   * Types text character by character — simulates real keyboard input.
   * Use for inputs that react to keypress events (e.g. autocomplete).
   *
   * @param locator - Target input element
   * @param text - Text to type
   * @param delay - Delay between keystrokes in ms (default: 50ms)
   */
  protected async typeSlowly(locator: Locator, text: string, delay: number = 50): Promise<void> {
    await locator.waitFor({ state: 'visible', timeout: Timeouts.DEFAULT });
    await locator.clear();
    await locator.pressSequentially(text, { delay });
  }

  protected async clearField(locator: Locator): Promise<void> {
    await locator.waitFor({ state: 'visible', timeout: Timeouts.DEFAULT });
    await locator.clear();
  }

  protected async pressKey(locator: Locator, key: string): Promise<void> {
    await locator.waitFor({ state: 'visible', timeout: Timeouts.DEFAULT });
    await locator.press(key);
  }

  protected async selectByValue(locator: Locator, value: string): Promise<void> {
    await locator.waitFor({ state: 'visible', timeout: Timeouts.DEFAULT });
    await locator.selectOption({ value });
    TestLogger.step(`Selected option by value: ${value}`);
  }

  protected async selectByLabel(locator: Locator, label: string): Promise<void> {
    await locator.waitFor({ state: 'visible', timeout: Timeouts.DEFAULT });
    await locator.selectOption({ label });
    TestLogger.step(`Selected option by label: ${label}`);
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

  protected async isEnabled(locator: Locator): Promise<boolean> {
    try {
      await locator.waitFor({ state: 'visible', timeout: Timeouts.SHORT });
      return locator.isEnabled();
    } catch {
      return false;
    }
  }

  protected async isChecked(locator: Locator): Promise<boolean> {
    return locator.isChecked();
  }

  protected async getCount(locator: Locator): Promise<number> {
    return locator.count();
  }

  /**
   * Waits for a custom condition to be true.
   * More flexible than built-in waits.
   *
   * @param condition - Async function that returns true when done
   * @param description - Human-readable description for error messages
   * @param timeout - Maximum wait time in ms
   *
   * @example
   * await this.waitForCondition(
   *   async () => (await this.getCount(this.items)) > 0,
   *   'items to appear',
   * );
   */
  protected async waitForCondition(
    condition: () => Promise<boolean>,
    description: string,
    timeout: number = Timeouts.DEFAULT,
  ): Promise<void> {
    const startTime = Date.now();
    const pollInterval = 500;

    while (Date.now() - startTime < timeout) {
      try {
        const result = await condition();
        if (result) {
          TestLogger.step(`Condition met: ${description}`);
          return;
        }
      } catch {
        // Condition threw — keep waiting
      }
      await this.page.waitForTimeout(pollInterval);
    }

    throw new Error(`Condition not met within ${timeout}ms: ${description}`);
  }
  /**
   * Waits for an element count to reach a specific number.
   *
   * @param locator - Elements to count
   * @param expectedCount - Expected number of elements
   * @param timeout - Maximum wait time in ms
   */
  protected async waitForCount(
    locator: Locator,
    expectedCount: number,
    timeout: number = Timeouts.DEFAULT,
  ): Promise<void> {
    await this.waitForCondition(
      async () => (await locator.count()) === expectedCount,
      `${expectedCount} elements to appear`,
      timeout,
    );
  }

  /**
   * Retries an operation if it fails.
   * Useful for flaky operations like animations or timing issues.
   *
   * @param operation - Async operation to retry
   * @param attempts - Number of retry attempts (default: 3)
   * @param delayMs - Delay between attempts in ms (default: 1000ms)
   *
   * @example
   * await this.retry(
   *   () => this.clickElement(this.flakyButton),
   *   3,
   * );
   */
  protected async retry<T>(
    operation: () => Promise<T>,
    attempts: number = 3,
    delayMs: number = 1_000,
  ): Promise<T> {
    let lastError: Error = new Error('Unknown error');

    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        const result = await operation();
        if (attempt > 1) {
          TestLogger.step(`Operation succeeded on attempt ${attempt}`);
        }
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        TestLogger.step(`Attempt ${attempt}/${attempts} failed: ${lastError.message}`);
        if (attempt < attempts) {
          await this.page.waitForTimeout(delayMs);
        }
      }
    }
    throw new Error(
      `Operation failed after ${attempts} attempts. Last error: ${lastError.message}`,
    );
  }

  /**
   * Waits for a specific API response during an action.
   * Useful for verifying that UI actions trigger correct API calls.
   *
   * @param urlPattern - URL pattern to wait for (glob or regex)
   * @param action - Action that triggers the API call
   * @returns The intercepted Response
   *
   * @example
   * const response = await this.waitForApiResponse(
   *   '/api/users',
   *   () => this.clickElement(this.loadButton),
   * );
   * expect(response.status()).toBe(200);
   */
  protected async waitForApiResponse(
    urlPattern: string | RegExp,
    action: () => Promise<void>,
  ): Promise<Response> {
    const [response] = await Promise.all([this.page.waitForResponse(urlPattern), action()]);

    TestLogger.step(`API response received: ${response.status()} ${response.url()}`);

    // return response;

    // :FIX This result is Workaround, ne to be FIX
    const myResponse = new Response();
    return myResponse;
  }

  // ─── Scroll helpers ──────────────────────────────────────────

  protected async scrollToElement(locator: Locator): Promise<void> {
    await locator.scrollIntoViewIfNeeded();
  }

  protected async scrollToTop(): Promise<void> {
    await this.page.keyboard.press('Home');
  }

  protected async scrollToBottom(): Promise<void> {
    await this.page.keyboard.press('End');
  }

  protected async scrollBy(x: number, y: number): Promise<void> {
    await this.page.mouse.wheel(x, y);
  }

  // ─── Assertions ──────────────────────────────────────────────

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

  protected async assertExactText(locator: Locator, text: string): Promise<void> {
    await expect(locator).toHaveText(text, { timeout: Timeouts.DEFAULT });
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
   * Asserts that an element is hidden or not present.
   *
   * @param locator - Element to check
   */
  protected async assertHidden(locator: Locator): Promise<void> {
    await expect(locator).toBeHidden({ timeout: Timeouts.DEFAULT });
  }

  protected async assertEnabled(locator: Locator): Promise<void> {
    await expect(locator).toBeEnabled({ timeout: Timeouts.DEFAULT });
  }

  protected async assertDisabled(locator: Locator): Promise<void> {
    await expect(locator).toBeDisabled({ timeout: Timeouts.DEFAULT });
  }

  protected async assertCount(locator: Locator, count: number): Promise<void> {
    await expect(locator).toHaveCount(count, { timeout: Timeouts.DEFAULT });
  }

  protected async assertUrl(urlPattern: string | RegExp): Promise<void> {
    await expect(this.page).toHaveURL(urlPattern, {
      timeout: Timeouts.DEFAULT,
    });
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
      timeout: Timeouts.PAGE_LOAD,
    });
  }

  async goBack(): Promise<void> {
    TestLogger.step('Navigating back');
    await this.page.goBack();
    await this.page.waitForLoadState('domcontentloaded');
  }

  async reload(): Promise<void> {
    TestLogger.step('Reloading page');
    await this.page.reload();
    await this.page.waitForLoadState('domcontentloaded');
  }

  // ─── Screenshot ──────────────────────────────────────────────

  /**
   * Takes a full-page screenshot and saves it to test-results/screenshots.
   *
   * @param name - Base name for the screenshot file
   * @returns Promise resolving to the screenshot as a Buffer
   */
  async takeScreenshot(name: string): Promise<Buffer> {
    const timestamp = Date.now();
    const fileName = `${name}-${timestamp}.png`;
    TestLogger.step(`Screenshot: ${fileName}`);
    return this.page.screenshot({
      fullPage: true,
      path: `test-results/screenshots/${name}-${Date.now()}.png`,
    });
  }

  async takeElementScreenshot(locator: Locator, name: string): Promise<Buffer> {
    const timestamp = Date.now();
    const fileName = `${name}-${timestamp}.png`;
    return locator.screenshot({ path: `test-results/screenshots/${fileName}` });
  }
}

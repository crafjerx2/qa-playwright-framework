/**
 * OPEN/CLOSED PRINCIPLE + LISKOV SUBSTITUTION
 *
 * BasePage is CLOSED for modification — we don't change it when adding new pages.
 * BasePage is OPEN for extension — new pages extend it and add their own methods.
 *
 * LISKOV SUBSTITUTION:
 * Any subclass (LoginPage, InventoryPage) can replace BasePage
 * wherever BasePage is used, without breaking anything.
 * This works because subclasses HONOR the contract defined here.
 */

import { Page, Locator, expect } from '@playwright/test';
import { IBasePage, IPageLoadable } from './interfaces';
import { EnvironmentConfig } from '@config/EnvironmentConfig';
import { TestLogger } from '@utils/Logger';

export abstract class BasePage implements IBasePage, IPageLoadable {
  readonly page: Page;
  protected readonly config = EnvironmentConfig.load();
  protected readonly baseUrl: string;

  constructor(page: Page) {
    this.page = page;
    this.baseUrl = this.config.application.baseUrl;
  }

  abstract isLoaded(): Promise<boolean>;

  async waitForLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
    const loaded = await this.isLoaded();
    if (!loaded) {
      throw new Error(`Page ${this.constructor.name} did not load correctly`);
    }
  }

  getTitle(): Promise<string> {
    return this.page.title();
  }

  /**
   * Navigate to a URL
   * Subclasses use this to navigate to their specific page
   */
  protected async navigateTo(path: string = ''): Promise<void> {
    const url = path.startsWith('http') ? path : `${this.baseUrl}${path}`;
    TestLogger.step(`Navigating to: ${url}`);
    await this.page.goto(url);
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Click element safely
   * Auto-waits for element to be visible and enabled
   */
  protected async clickElement(locator: Locator): Promise<void> {
    await locator.waitFor({ state: 'visible' });
    await locator.click();
  }

  /**
   * Type text into field — clears first
   */
  protected async typeText(locator: Locator, text: string): Promise<void> {
    await locator.waitFor({ state: 'visible' });
    await locator.clear();
    await locator.fill(text);
  }

  /**
   * Get text from element safely
   */
  protected async getText(locator: Locator): Promise<string> {
    await locator.waitFor({ state: 'visible' });
    return locator.innerText();
  }

  /**
   * Check if element is visible without throwing
   */
  protected async isVisible(locator: Locator): Promise<boolean> {
    try {
      await locator.waitFor({ state: 'visible', timeout: 3000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Assert element contains text
   * Uses Playwright's built-in assertion with retry
   */
  protected async assertContainsText(locator: Locator, text: string): Promise<void> {
    await expect(locator).toContainText(text);
  }

  /**
   * Assert element is visible
   */
  protected async assertVisible(locator: Locator): Promise<void> {
    await expect(locator).toBeVisible();
  }

  /**
   * Wait for URL to contain a specific path
   */
  protected async waitForUrl(urlPart: string): Promise<void> {
    await this.page.waitForURL(`**/${urlPart}**`);
  }

  /**
   * Get current URL
   */
  async getCurrentUrl(): Promise<string> {
    return this.page.url();
  }

  /**
   * Take a screenshot
   */
  async takeScreenshot(name: string): Promise<Buffer> {
    TestLogger.step(`Taking screenshot: ${name}`);
    return this.page.screenshot({
      fullPage: true,
      path: `test-results/screenshots/${name}-${Date.now()}.png`,
    });
  }
}

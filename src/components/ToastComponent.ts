/**
 * @fileoverview Toast notification and alert component.
 *
 * @description
 * Handles transient notifications that appear briefly on screen.
 * Toast messages are common in modern web apps and tricky to test
 * because they disappear after a short time.
 *
 * @example
 * const toast = new ToastComponent(page);
 * await someAction();
 * const message = await toast.waitForMessage();
 * expect(message).toContain('Added to cart');
 */
import { Page, Locator } from '@playwright/test';
import { Timeouts } from '@config/Constants';
import { TestLogger } from '@utils/Logger';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export class ToastComponent {
  private readonly page: Page;

  // Common toast selectors — customize for your app
  private readonly toastContainer: Locator;
  private readonly successToast: Locator;
  private readonly errorToast: Locator;

  /**
   * @param page - Playwright Page instance
   * @param containerSelector - CSS selector for the toast container
   */
  constructor(page: Page, containerSelector: string = '.toast, [role="alert"], .notification') {
    this.page = page;
    this.toastContainer = page.locator(containerSelector);
    this.successToast = page.locator('.toast-success, .alert-success');
    this.errorToast = page.locator('.toast-error, .alert-error');
  }

  /**
   * Waits for any toast to appear and returns its text.
   * Useful for transient messages that disappear quickly.
   *
   * @param timeout - How long to wait for the toast
   * @returns Toast message text
   */
  async waitForMessage(timeout: number = Timeouts.DEFAULT): Promise<string> {
    TestLogger.step('Waiting for toast message');
    await this.toastContainer.waitFor({ state: 'visible', timeout });
    const text = await this.toastContainer.innerText();
    TestLogger.step(`Toast appeared: "${text}"`);
    return text;
  }

  /**
   * Waits for a success toast and returns its text.
   */
  async waitForSuccess(timeout: number = Timeouts.DEFAULT): Promise<string> {
    await this.successToast.waitFor({ state: 'visible', timeout });
    return this.successToast.innerText();
  }

  /**
   * Waits for an error toast and returns its text.
   */
  async waitForError(timeout: number = Timeouts.DEFAULT): Promise<string> {
    await this.errorToast.waitFor({ state: 'visible', timeout });
    return this.errorToast.innerText();
  }

  /**
   * Checks if a toast is currently visible.
   */
  async isVisible(): Promise<boolean> {
    try {
      await this.toastContainer.waitFor({
        state: 'visible',
        timeout: Timeouts.SHORT,
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Dismisses the toast by clicking a close button if available.
   */
  async dismiss(): Promise<void> {
    const closeButton = this.toastContainer.locator('button.close, [aria-label="Close"]');
    const isVisible = await closeButton.isVisible();
    if (isVisible) {
      await closeButton.click();
      TestLogger.step('Toast dismissed');
    }
  }

  /**
   * Waits for the toast to disappear.
   *
   * @param timeout - How long to wait for dismissal
   */
  async waitForDisappear(timeout: number = Timeouts.LONG): Promise<void> {
    await this.toastContainer.waitFor({ state: 'hidden', timeout });
    TestLogger.step('Toast dismissed automatically');
  }
}

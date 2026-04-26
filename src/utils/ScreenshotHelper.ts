/**
 * @fileoverview Screenshot and video capture utilities.
 *
 * @description
 * Provides methods for capturing screenshots in different scenarios:
 * - On demand during tests
 * - On test failure (automatic)
 * - Element-level screenshots
 * - Full-page vs viewport
 *
 * ## Why a dedicated helper?
 * Screenshots are taken in multiple places:
 * - Page objects (on action failure)
 * - Test hooks (on test failure)
 * - Tests themselves (for visual verification)
 *
 * Centralizing keeps the logic in one place.
 */
import { Page, Locator, TestInfo } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { TestLogger } from './Logger';

export interface ScreenshotOptions {
  /** Whether to capture the full page or just viewport */
  fullPage?: boolean;
  /** Animations state during capture */
  animations?: 'disabled' | 'allow';
  /** Clip to specific area */
  clip?: { x: number; y: number; width: number; height: number };
  /** Scale factor */
  scale?: 'css' | 'device';
}

export class ScreenshotHelper {
  private static readonly BASE_DIR = path.join(process.cwd(), 'test-results', 'screenshots');

  static {
    if (!fs.existsSync(ScreenshotHelper.BASE_DIR)) {
      fs.mkdirSync(ScreenshotHelper.BASE_DIR, { recursive: true });
    }
  }

  // ─── Page screenshots ────────────────────────────────────────

  /**
   * Takes a full-page screenshot and saves it to disk.
   *
   * @param page - Playwright Page to screenshot
   * @param name - Base name for the file
   * @param options - Screenshot options
   * @returns Path to the saved screenshot
   */
  static async capture(page: Page, name: string, options: ScreenshotOptions = {}): Promise<string> {
    const fileName = this.buildFileName(name);
    const filePath = path.join(this.BASE_DIR, fileName);

    await page.screenshot({
      path: filePath,
      fullPage: options.fullPage ?? true,
      animations: options.animations ?? 'disabled',
      clip: options.clip,
      scale: options.scale ?? 'css',
    });

    TestLogger.screenshot(name, filePath);
    return filePath;
  }

  /**
   * Takes a screenshot and returns it as a Buffer.
   * Use this when you need to attach to a report.
   */
  static async captureAsBuffer(page: Page, options: ScreenshotOptions = {}): Promise<Buffer> {
    return page.screenshot({
      fullPage: options.fullPage ?? true,
      animations: options.animations ?? 'disabled',
    });
  }

  // ─── Element screenshots ─────────────────────────────────────

  /**
   * Takes a screenshot of a specific element.
   * Useful for visual comparison of components.
   *
   * @param locator - Element to screenshot
   * @param name - Base name for the file
   * @returns Path to the saved screenshot
   */
  static async captureElement(locator: Locator, name: string): Promise<string> {
    const fileName = this.buildFileName(`element-${name}`);
    const filePath = path.join(this.BASE_DIR, fileName);

    await locator.screenshot({ path: filePath });
    TestLogger.screenshot(`element: ${name}`, filePath);
    return filePath;
  }

  // ─── Failure screenshots ─────────────────────────────────────

  /**
   * Captures a screenshot when a test fails.
   * Attaches to Playwright TestInfo for HTML report inclusion.
   *
   * @param page - Current page
   * @param testInfo - Playwright TestInfo
   * @returns Path to screenshot or undefined if not captured
   */
  static async captureOnFailure(page: Page, testInfo: TestInfo): Promise<string | undefined> {
    if (testInfo.status === 'passed') return undefined;

    try {
      const name = `FAILURE_${testInfo.title}`;
      const screenshot = await this.captureAsBuffer(page);

      // Attach to Playwright HTML report
      await testInfo.attach('failure-screenshot', {
        body: screenshot,
        contentType: 'image/png',
      });

      // Also save to disk
      const filePath = await this.saveBuffer(screenshot, name);
      TestLogger.screenshot('Failure screenshot', filePath);
      return filePath;
    } catch (error) {
      TestLogger.warn(`Failed to capture screenshot: ${String(error)}`);
      return undefined;
    }
  }
  // ─── Comparison screenshots ──────────────────────────────────

  /**
   * Takes a screenshot for visual regression comparison.
   * Uses Playwright's built-in toMatchSnapshot.
   *
   * @param page - Current page
   * @param snapshotName - Snapshot identifier
   *
   * @example
   * // In a test with expect:
   * await expect(page).toHaveScreenshot('login-page.png', {
   *   maxDiffPixels: 100,
   * });
   */
  static async captureForComparison(page: Page, snapshotName: string): Promise<Buffer> {
    const buffer = await page.screenshot({
      fullPage: true,
      animations: 'disabled',
    });

    TestLogger.step(`Visual snapshot: ${snapshotName}`);
    return buffer;
  }

  // ─── Video helpers ───────────────────────────────────────────

  /**
   * Gets the video path after test completion.
   * Video is recorded automatically when configured.
   *
   * @param page - Current page
   * @returns Video path or undefined
   */
  static async getVideoPath(page: Page): Promise<string | undefined> {
    try {
      const video = page.video();
      if (!video) return undefined;

      const videoPath = await video.path();
      TestLogger.video(videoPath);
      return videoPath;
    } catch {
      return undefined;
    }
  }

  // ─── Utilities ───────────────────────────────────────────────

  private static buildFileName(name: string): string {
    const clean = name
      .replace(/[^a-zA-Z0-9\-_\s]/g, '')
      .replace(/\s+/g, '-')
      .toLowerCase()
      .substring(0, 80);
    const timestamp = Date.now();
    return `${clean}-${timestamp}.png`;
  }

  private static async saveBuffer(buffer: Buffer, name: string): Promise<string> {
    const fileName = this.buildFileName(name);
    const filePath = path.join(this.BASE_DIR, fileName);
    fs.writeFileSync(filePath, buffer);
    return filePath;
  }
}

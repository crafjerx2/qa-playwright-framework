/**
 * @fileoverview Centralized report management for the framework.
 *
 * @description
 * Manages all reporting concerns:
 * - Test result tracking
 * - Screenshot capture and attachment
 * - Allure step annotations
 * - Report metadata
 *
 * SINGLE RESPONSIBILITY: Only manages test reporting state.
 * FACADE PATTERN: Simplifies Allure's complex API.
 *
 * @example
 * In a test:
 * ReportManager.addStep('Click login button');
 * ReportManager.addLabel('feature', 'Authentication');
 * ReportManager.attachScreenshot(screenshotBuffer, 'Login page');
 */
import * as fs from 'fs';
import * as path from 'path';
import { TestInfo } from '@playwright/test';
import { TestLogger } from '../utils/Logger';

// ─── Types ───────────────────────────────────────────────────

export interface TestResult {
  name: string;
  status: 'passed' | 'failed' | 'skipped' | 'timedOut';
  duration: number;
  error?: string;
  screenshotPath?: string;
  videoPath?: string;
  tracePath?: string;
  retries: number;
  tags: string[];
}

export interface StepInfo {
  name: string;
  status: 'passed' | 'failed';
  duration: number;
  error?: string;
}

// ─── ReportManager ───────────────────────────────────────────

export class ReportManager {
  private static readonly SCREENSHOTS_DIR = path.join(process.cwd(), 'test-results', 'screenshots');

  private static readonly REPORTS_DIR = path.join(process.cwd(), 'test-results');

  static {
    // Ensure directories exist
    [ReportManager.SCREENSHOTS_DIR, ReportManager.REPORTS_DIR].forEach((dir) => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * Captures a screenshot and attaches it to the test report.
   * Works with both Playwright HTML reporter and Allure.
   *
   * @param testInfo - Playwright TestInfo from the current test
   * @param name - Name for the screenshot
   * @param screenshot - Screenshot buffer (from page.screenshot())
   */
  static async attachScreenshot(
    testInfo: TestInfo,
    name: string,
    screenshot: Buffer,
  ): Promise<string> {
    const fileName = `${this.sanitizeName(name)}-${Date.now()}.png`;
    const filePath = path.join(this.SCREENSHOTS_DIR, fileName);

    // Save to disk
    fs.writeFileSync(filePath, screenshot);

    // Attach to Playwright report
    await testInfo.attach(name, {
      body: screenshot,
      contentType: 'image/png',
    });

    TestLogger.screenshot(name, filePath);
    return filePath;
  }

  /**
   * Captures and attaches a screenshot on test failure.
   * Called automatically in the test teardown.
   *
   * @param testInfo - Playwright TestInfo
   * @param page - Playwright Page to screenshot
   */
  static async captureFailureScreenshot(
    testInfo: TestInfo,
    page: import('@playwright/test').Page,
  ): Promise<string | undefined> {
    if (testInfo.status !== 'passed') {
      try {
        const screenshot = await page.screenshot({
          fullPage: true,
          animations: 'disabled',
        });

        const name = `FAILURE - ${testInfo.title}`;
        return await this.attachScreenshot(testInfo, name, screenshot);
      } catch (error) {
        TestLogger.warn(`Could not capture failure screenshot: ${String(error)}`);
        return undefined;
      }
    }
    return undefined;
  }

  // ─── Test metadata ───────────────────────────────────────────

  /**
   * Adds a step annotation to the Allure report.
   * Steps appear as a timeline in the report.
   *
   * @param testInfo - Playwright TestInfo
   * @param stepName - Human-readable step description
   */
  static addStep(testInfo: TestInfo, stepName: string): void {
    testInfo.annotations.push({
      type: 'step',
      description: `-> ${stepName}`,
    });
    TestLogger.step(stepName);
  }

  /**
   * Adds a label to the test for filtering in Allure.
   * Common labels: feature, story, severity, owner
   *
   * @param testInfo - Playwright TestInfo
   * @param name - Label name
   * @param value - Label value
   *
   * @example
   * ReportManager.addLabel(testInfo, 'feature', 'Authentication');
   * ReportManager.addLabel(testInfo, 'severity', 'critical');
   */
  static addLabel(testInfo: TestInfo, name: string, value: string): void {
    testInfo.annotations.push({ type: name, description: value });
  }

  /**
   * Adds a description to the test report.
   */
  static addDescription(testInfo: TestInfo, description: string): void {
    testInfo.annotations.push({
      type: 'description',
      description,
    });
  }

  /**
   * Marks a test with a severity level.
   * Used for prioritization in Allure dashboard.
   */
  static setSeverity(
    testInfo: TestInfo,
    severity: 'blocker' | 'critical' | 'normal' | 'minor' | 'trivial',
  ): void {
    this.addLabel(testInfo, 'severity', severity);
  }

  // ─── Text attachments ────────────────────────────────────────

  /**
   * Attaches plain text to the test report.
   * Useful for logging API responses, SQL queries, etc.
   */
  static async attachText(testInfo: TestInfo, name: string, content: string): Promise<void> {
    await testInfo.attach(name, {
      body: content,
      contentType: 'text/plain',
    });
  }

  /**
   * Attaches JSON data to the test report.
   * Useful for API response bodies.
   */
  static async attachJson(testInfo: TestInfo, name: string, data: unknown): Promise<void> {
    await testInfo.attach(name, {
      body: JSON.stringify(data, null, 2),
      contentType: 'application/json',
    });
  }

  // ─── Results tracking ────────────────────────────────────────

  /**
   * Builds a TestResult from Playwright's TestInfo.
   * Used for custom reporting and logging.
   */
  static buildResult(testInfo: TestInfo): TestResult {
    return {
      name: testInfo.title,
      status: testInfo.status as TestResult['status'],
      duration: testInfo.duration,
      error: testInfo.error?.message,
      screenshotPath: undefined,
      retries: testInfo.retry,
      tags: testInfo.tags,
    };
  }

  // ─── Utilities ───────────────────────────────────────────────

  private static sanitizeName(name: string): string {
    return name
      .replace(/[^a-zA-Z0-9\-_]/g, '_')
      .replace(/_+/g, '_')
      .toLowerCase()
      .substring(0, 100);
  }
}

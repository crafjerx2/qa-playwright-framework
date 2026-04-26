/**
 * Tests that demonstrate the reporting features:
 * - Step logging
 * - Screenshot on failure
 * - Test metadata
 * - Attachments
 */

import { test, expect } from '../../src/fixtures';
import { ReportManager } from '../../src/reporting/ReportManager';
import { ScreenshotHelper } from '../../src/utils/ScreenshotHelper';

test.describe('Reporting — Screenshots, Logs, Attachments', () => {
  test('@smoke Steps appear in report', async ({ authenticatedInventoryPage }, testInfo) => {
    // Add metadata to report
    ReportManager.addLabel(testInfo, 'feature', 'Inventory');
    ReportManager.setSeverity(testInfo, 'normal');

    // Steps are logged and appear in report
    ReportManager.addStep(testInfo, 'Verifying inventory page loaded');
    const isLoaded = await authenticatedInventoryPage.isLoaded();
    expect(isLoaded).toBe(true);

    ReportManager.addStep(testInfo, 'Checking product count');
    const count = await authenticatedInventoryPage.getItemCount();
    expect(count).toBe(6);

    ReportManager.addStep(testInfo, 'Verifying page title');
    const title = await authenticatedInventoryPage.getPageTitle();
    expect(title).toBe('Products');
  });

  test('@smoke Screenshot can be captured on demand', async ({
    authenticatedInventoryPage,
  }, testInfo) => {
    ReportManager.addStep(testInfo, 'Taking on-demand screenshot');

    // Capture screenshot and attach to report
    const screenshot = await ScreenshotHelper.captureAsBuffer(authenticatedInventoryPage.page);

    await testInfo.attach('inventory-page', {
      body: screenshot,
      contentType: 'image/png',
    });

    expect(screenshot).toBeTruthy();
    expect(screenshot.length).toBeGreaterThan(0);
  });

  test('@smoke JSON data can be attached to report', async ({
    authenticatedInventoryPage,
  }, testInfo) => {
    const cards = await authenticatedInventoryPage.getAllProductCards();
    const firstProduct = await cards[0].getDetails();

    // Attach product data as JSON to the report
    await ReportManager.attachJson(testInfo, 'first-product', firstProduct);

    expect(firstProduct.name).toBeTruthy();
    expect(firstProduct.price).toBeGreaterThan(0);
  });

  test.fail(
    '@regression Failure test captures screenshot automatically',
    async ({ loginPage }, testInfo) => {
      ReportManager.setSeverity(testInfo, 'critical');

      await loginPage.login('wrong_user', 'wrong_pass');

      // This will fail — screenshot captured automatically by fixture
      const url = await loginPage.getCurrentUrl();
      expect(url).toContain('inventory'); // Will FAIL — stays on login

      // Screenshot is taken automatically in teardown
    },
  );
});

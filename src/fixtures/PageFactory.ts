import { InventoryPage } from '@pages/inventory/InventoryPage';
import { LoginPage } from '@pages/login/LoginPage';
import { Page, BrowserContext, Browser } from '@playwright/test';
import { TestLogger } from '@utils/Logger';

export class PageFactory {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  createLoginPage(): LoginPage {
    TestLogger.step('Factory: creating LoginPage');
    return new LoginPage(this.page);
  }

  createInventoryPage(): InventoryPage {
    TestLogger.step('Factory: creating InventoryPage');
    return new InventoryPage(this.page);
  }

  async createAuthenticatedInventoryPage(
    username: string,
    password: string,
  ): Promise<InventoryPage> {
    TestLogger.step('Factory: creating authenticated InventoryPage');
    const loginPage = this.createLoginPage();
    await loginPage.navigate();
    await loginPage.login(username, password);

    const inventoryPage = this.createInventoryPage();
    await inventoryPage.waitForLoad();

    return inventoryPage;
  }
}

export class BrowserContextFactory {
  static createDefaultContext(browser: Browser): Promise<BrowserContext> {
    TestLogger.step('Factory: creating default browser context');

    return browser.newContext({
      viewport: { width: 1920, height: 1080 },
      ignoreHTTPSErrors: true,
      locale: 'en-NZ',
      timezoneId: 'Pacific/Auckland',
    });
  }

  static createMobileContext(browser: Browser): Promise<BrowserContext> {
    TestLogger.step('Factory: creating mobile browser context');
    return browser.newContext({
      viewport: { width: 390, height: 844 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
      isMobile: true,
      hasTouch: true,
    });
  }

  static createApiContext(browser: Browser): Promise<BrowserContext> {
    TestLogger.step('Factory: creating API browser context');
    return browser.newContext({
      extraHTTPHeaders: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
  }
}

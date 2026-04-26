import { Selectors, Timeouts } from '@config/Constants';
import { Page, Locator } from '@playwright/test';
import { TestLogger } from '@utils/Logger';

export class NavigationBar {
  private readonly page: Page;

  // Locators — private, only this component knows them
  private readonly cartIcon: Locator;
  private readonly cartBadge: Locator;
  private readonly hamburgerMenu: Locator;
  private readonly logoutLink: Locator;
  private readonly allItemsLink: Locator;
  // private readonly aboutLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.cartIcon = page.locator('.shopping_cart_link');
    this.cartBadge = page.locator('.shopping_cart_badge');
    this.hamburgerMenu = page.locator('#react-burger-menu-btn');
    this.logoutLink = page.locator('#logout_sidebar_link');
    this.allItemsLink = page.locator('#inventory_sidebar_link');
    //this.aboutLink = page.locator('#about_sidebar_link');
  }

  async clickCart(): Promise<void> {
    TestLogger.step('Clicking cart icon');
    await this.cartIcon.click();
  }

  async getCartCount(): Promise<number> {
    try {
      await this.cartBadge.waitFor({ state: 'visible', timeout: Timeouts.SHORT });
      const text = await this.cartBadge.innerText();
      return parseInt(text);
    } catch {
      return 0;
    }
  }

  async isCartEmpty(): Promise<boolean> {
    return (await this.getCartCount()) === 0;
  }

  async openMenu(): Promise<void> {
    TestLogger.step('Opening hamburger menu');
    await this.hamburgerMenu.click();
    await this.page.waitForTimeout(Timeouts.ANIMATION); // menu animation
  }

  async logout(): Promise<void> {
    await this.openMenu();
    TestLogger.step('Clicking logout');
    await this.logoutLink.waitFor({ state: 'visible' });
    await this.logoutLink.click();
  }

  async goToAllItems(): Promise<void> {
    await this.openMenu();
    await this.allItemsLink.waitFor({ state: 'visible' });
    await this.allItemsLink.click();
  }
}

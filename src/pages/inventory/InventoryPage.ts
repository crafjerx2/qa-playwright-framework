import { Page, Locator } from '@playwright/test';
import { BasePage } from '../base/BasePage';
import { INavigable, IListable } from '../base/interfaces';
import { TestLogger } from '../../utils/Logger';

export interface ProductInfo {
  name: string;
  price: string;
  description: string;
}

export class InventoryPage extends BasePage implements INavigable, IListable {
  // ─── Locators ───────────────────────────────────────────────
  private readonly pageTitle: Locator;
  private readonly inventoryItems: Locator;
  private readonly itemNames: Locator;
  private readonly itemPrices: Locator;
  private readonly addToCartButtons: Locator;
  private readonly cartIcon: Locator;
  private readonly cartBadge: Locator;
  private readonly sortDropdown: Locator;
  private readonly hamburgerMenu: Locator;
  private readonly logoutLink: Locator;

  constructor(page: Page) {
    super(page);

    this.pageTitle = page.locator('.title');
    this.inventoryItems = page.locator('.inventory_item');
    this.itemNames = page.locator('.inventory_item_name');
    this.itemPrices = page.locator('.inventory_item_price');
    this.addToCartButtons = page.locator('[data-test^="add-to-cart"]');
    this.cartIcon = page.locator('.shopping_cart_link');
    this.cartBadge = page.locator('.shopping_cart_badge');
    this.sortDropdown = page.locator('[data-test="product-sort-container"]');
    this.hamburgerMenu = page.locator('#react-burger-menu-btn');
    this.logoutLink = page.locator('#logout_sidebar_link');
  }

  // ─── IPageLoadable ───────────────────────────────────────────

  async isLoaded(): Promise<boolean> {
    return this.isVisible(this.pageTitle);
  }

  // ─── INavigable ─────────────────────────────────────────────

  async navigate(): Promise<void> {
    TestLogger.step('Navigating to Inventory page');
    await this.navigateTo('/inventory.html');
    await this.waitForLoad();
  }

  async getCurrentUrl(): Promise<string> {
    return this.page.url();
  }

  // ─── IListable ───────────────────────────────────────────────

  async getItemCount(): Promise<number> {
    return this.inventoryItems.count();
  }

  async getItemNames(): Promise<string[]> {
    return this.itemNames.allInnerTexts();
  }

  async selectItemByIndex(index: number): Promise<void> {
    const items = await this.itemNames.all();
    if (index < items.length) {
      await items[index].click();
    }
  }

  // ─── InventoryPage-specific methods ─────────────────────────

  async getPageTitle(): Promise<string> {
    return this.getText(this.pageTitle);
  }

  async getAllProducts(): Promise<ProductInfo[]> {
    const names = await this.itemNames.allInnerTexts();
    const prices = await this.itemPrices.allInnerTexts();
    const descriptions = await this.page.locator('.inventory_item_desc').allInnerTexts();

    return names.map((name, index) => ({
      name,
      price: prices[index] ?? '',
      description: descriptions[index] ?? '',
    }));
  }

  async addToCartByIndex(index: number): Promise<void> {
    const buttons = await this.addToCartButtons.all();
    if (index < buttons.length) {
      TestLogger.step(`Adding product at index ${index} to cart`);
      await buttons[index].click();
    }
  }

  async addFirstProductToCart(): Promise<void> {
    await this.addToCartByIndex(0);
  }

  async getCartCount(): Promise<number> {
    const isVisible = await this.isVisible(this.cartBadge);
    if (!isVisible) return 0;
    const text = await this.getText(this.cartBadge);
    return parseInt(text);
  }

  async sortProducts(option: 'az' | 'za' | 'lohi' | 'hilo'): Promise<void> {
    TestLogger.step(`Sorting products by: ${option}`);
    await this.sortDropdown.selectOption(option);
  }

  async logout(): Promise<void> {
    TestLogger.step('Logging out');
    await this.clickElement(this.hamburgerMenu);
    await this.logoutLink.waitFor({ state: 'visible' });
    await this.clickElement(this.logoutLink);
  }
}

import { Page, Locator } from '@playwright/test';
import { BasePage } from '../base/BasePage';
import { INavigable, IListable } from '../base/interfaces';
import { TestLogger } from '../../utils/Logger';
import { NavigationBar } from '@components/NavigationBar';
import { ProductCard } from '@components/ProductCard';

export interface ProductInfo {
  name: string;
  price: string;
  description: string;
}

export class InventoryPage extends BasePage implements INavigable, IListable {
  // ─── Locators ───────────────────────────────────────────────
  readonly nav: NavigationBar;
  private readonly pageTitle: Locator;
  private readonly inventoryItems: Locator;
  private readonly sortDropdown: Locator;

  constructor(page: Page) {
    super(page);
    this.nav = new NavigationBar(page);

    this.pageTitle = page.locator('.title');
    this.inventoryItems = page.locator('.inventory_item');
    this.sortDropdown = page.locator('[data-test="product-sort-container"]');
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
    const cards = await this.getAllProductCards();
    return Promise.all(cards.map((c) => c.getName()));
  }

  async selectItemByIndex(index: number): Promise<void> {
    const cards = await this.getAllProductCards();
    if (index < cards.length) {
      await cards[index].clickName();
    }
  }

  // ─── InventoryPage-specific methods ─────────────────────────

  async getPageTitle(): Promise<string> {
    return this.getText(this.pageTitle);
  }

  async sortProducts(option: 'az' | 'za' | 'lohi' | 'hilo'): Promise<void> {
    TestLogger.step(`Sorting products by: ${option}`);
    await this.sortDropdown.selectOption(option);
  }

  async getAllProductCards(): Promise<ProductCard[]> {
    const count = await this.inventoryItems.count();
    let cards: ProductCard[] = [];

    for (let i = 0; i < count; i++) {
      cards = [...cards, new ProductCard(this.inventoryItems.nth(i))];
    }

    return cards;
  }

  async getProductCardByName(name: string): Promise<ProductCard | undefined> {
    const cards = await this.getAllProductCards();
    for (let card of cards) {
      const cardName = await card.getName();
      if (name === cardName) return card;
    }

    return undefined;
  }

  async getPrices(): Promise<number[]> {
    const cards = await this.getAllProductCards();
    return Promise.all(cards.map((c) => c.getPrice()));
  }
}

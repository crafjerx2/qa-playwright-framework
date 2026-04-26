import { Page, Locator } from '@playwright/test';
import { BasePage } from '../base/BasePage';
import { INavigable, IListable } from '../base/interfaces';
import { NavigationBar } from '@components/NavigationBar';
import { ProductCard } from '@components/ProductCard';
import { DropdownComponent } from '@components/DropdownComponent';
import { Routes, SauceDemo, Selectors } from '@config/Constants';
import { Locators } from '@utils/LocatorStrategies';

export interface ProductInfo {
  name: string;
  price: string;
  description: string;
}

export class InventoryPage extends BasePage implements INavigable, IListable {
  // ─── Components ──────────────────────────────────────────────
  readonly nav: NavigationBar;
  readonly sortDropdown: DropdownComponent;
  // ─── Locators ────────────────────────────────────────────────
  private readonly pageTitle: Locator;
  private readonly inventoryItems: Locator;

  constructor(page: Page) {
    super(page);

    this.nav = new NavigationBar(page);
    this.sortDropdown = new DropdownComponent(
      page.locator(Selectors.INVENTORY.SORT_DROPDOWN),
      'Sort Dropdown',
    );

    this.pageTitle = page.locator(Selectors.INVENTORY.TITLE);
    this.inventoryItems = page.locator(Selectors.INVENTORY.ITEMS);
  }

  // ─── IPageLoadable ───────────────────────────────────────────

  async isLoaded(): Promise<boolean> {
    return this.isVisible(this.pageTitle);
  }

  // ─── INavigable ─────────────────────────────────────────────

  async navigate(): Promise<void> {
    await this.navigateTo(Routes.INVENTORY);
    await this.waitForLoad();
  }

  getCurrentUrl(): string {
    return this.page.url();
  }

  // ─── IListable ───────────────────────────────────────────────

  async getItemCount(): Promise<number> {
    await this.waitForCount(this.inventoryItems, SauceDemo.PRODUCTS.TOTAL_COUNT);

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

  // ─── Component-based methods ─────────────────────────────────
  async getAllProductCards(): Promise<ProductCard[]> {
    const count = await this.inventoryItems.count();
    return Array.from({ length: count }, (_, i) => new ProductCard(this.inventoryItems.nth(i)));
  }

  async getProductCardByName(name: string): Promise<ProductCard | undefined> {
    // Custom locator strategy — filter by text
    const filtered = Locators.withText(this.inventoryItems, name);
    const count = await filtered.count();

    if (count === 0) return undefined;
    return new ProductCard(filtered.first());
  }

  async getPageTitle(): Promise<string> {
    return this.getText(this.pageTitle);
  }

  async getPrices(): Promise<number[]> {
    const cards = await this.getAllProductCards();
    return Promise.all(cards.map((c) => c.getPrice()));
  }

  // ─── Sort using DropdownComponent ────────────────────────────
  async sortByPriceLowToHigh(): Promise<void> {
    await this.sortDropdown.selectByValue(SauceDemo.SORT_OPTIONS.LOW_HIGH);
  }

  async sortByPriceHighToLow(): Promise<void> {
    await this.sortDropdown.selectByValue(SauceDemo.SORT_OPTIONS.HIGH_LOW);
  }

  async sortByNameAZ(): Promise<void> {
    await this.sortDropdown.selectByValue(SauceDemo.SORT_OPTIONS.AZ);
  }

  async sortByNameZA(): Promise<void> {
    await this.sortDropdown.selectByValue(SauceDemo.SORT_OPTIONS.ZA);
  }
}

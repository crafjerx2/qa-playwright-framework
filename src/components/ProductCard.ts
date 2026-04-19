import { Page, Locator } from '@playwright/test';
import { TestLogger } from '@utils/Logger';
export interface ProductDetails {
  name: string;
  description: string;
  price: number;
  priceText: string;
}

export class ProductCard {
  private readonly container: Locator;

  // Child locators — relative to this card's container
  private readonly nameLocator: Locator;
  private readonly descriptionLocator: Locator;
  private readonly priceLocator: Locator;
  private readonly addToCartButton: Locator;
  private readonly removeButton: Locator;

  constructor(container: Locator) {
    this.container = container;

    // All locators are RELATIVE to this card — not the whole page
    // This is what makes components powerful
    this.nameLocator = container.locator('.inventory_item_name');
    this.descriptionLocator = container.locator('.inventory_item_desc');
    this.priceLocator = container.locator('.inventory_item_price');
    this.addToCartButton = container.locator('[data-test^="add-to-cart"]');
    this.removeButton = container.locator('[data-test^="remove"]');
  }

  async getName(): Promise<string> {
    return this.nameLocator.innerText();
  }

  async getDescription(): Promise<string> {
    return this.descriptionLocator.innerText();
  }

  async getPriceText(): Promise<string> {
    return this.priceLocator.innerText();
  }

  async getPrice(): Promise<number> {
    const priceText = await this.getPriceText();
    return parseFloat(priceText.replace('$', ''));
  }

  async getDetails(): Promise<ProductDetails> {
    const [name, description, priceText, price] = await Promise.all([
      this.getName(),
      this.getDescription(),
      this.getPriceText(),
      this.getPrice(),
    ]);
    return { name, description, price, priceText };
  }

  async addToCart(): Promise<void> {
    const name = await this.getName();
    TestLogger.step(`Adding to cart: ${name}`);
    await this.addToCartButton.click();
  }

  async removeFromCart(): Promise<void> {
    const name = await this.getName();
    TestLogger.step(`Removing from cart: ${name}`);
    await this.removeButton.click();
  }

  async isInCart(): Promise<boolean> {
    return this.removeButton.isVisible();
  }

  async clickName(): Promise<void> {
    await this.nameLocator.click();
  }
}

/**
 * Tests demonstrating:
 * - Component Objects (DropdownComponent, NavigationBar, ProductCard)
 * - Custom Locator Strategies
 * - Advanced BasePage features (retry, waitForCondition)
 */

import { expect, test } from '@fixtures/index';
import { Locators } from '@utils/LocatorStrategies';

test.describe('Components — DropdownComponent + ProductCard', () => {
  test('@smoke Sort dropdown has expected options', async ({ authenticatedInventoryPage }) => {
    const options = await authenticatedInventoryPage.sortDropdown.getAllOptions();

    expect(options).toContain('Name (A to Z)');
    expect(options).toContain('Name (Z to A)');
    expect(options).toContain('Price (low to high)');
    expect(options).toContain('Price (high to low)');
  });

  test('@regression Sort low to high orders prices correctly', async ({
    authenticatedInventoryPage,
  }) => {
    await authenticatedInventoryPage.sortByPriceLowToHigh();

    const prices = await authenticatedInventoryPage.getPrices();

    for (let i = 1; i < prices.length; i++) {
      expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1]);
    }
  });

  test('@regression Sort high to low orders prices correctly', async ({
    authenticatedInventoryPage,
  }) => {
    await authenticatedInventoryPage.sortByPriceHighToLow();

    const prices = await authenticatedInventoryPage.getPrices();

    for (let i = 1; i < prices.length; i++) {
      expect(prices[i]).toBeLessThanOrEqual(prices[i - 1]);
    }
  });

  test('@smoke ProductCard getDetails returns complete data', async ({
    authenticatedInventoryPage,
  }) => {
    const cards = await authenticatedInventoryPage.getAllProductCards();
    const details = await cards[0].getDetails();

    expect(details.name).toBeTruthy();
    expect(details.price).toBeGreaterThan(0);
    expect(details.description).toBeTruthy();
    expect(details.priceText).toMatch(/^\$\d+\.\d{2}$/);
  });

  test('@regression Find product by name using custom locator', async ({
    authenticatedInventoryPage,
  }) => {
    const card = await authenticatedInventoryPage.getProductCardByName('Sauce Labs Backpack');

    expect(card).toBeDefined();
    const details = await card!.getDetails();
    expect(details.name).toBe('Sauce Labs Backpack');
    expect(details.price).toBe(29.99);
  });

  test('@regression Add and remove product from cart', async ({ authenticatedInventoryPage }) => {
    const cards = await authenticatedInventoryPage.getAllProductCards();
    const firstCard = cards[0];

    // Initially not in cart
    const initiallyInCart = await firstCard.isInCart();
    expect(initiallyInCart).toBe(false);

    // Add to cart
    await firstCard.addToCart();
    const cartCount = await authenticatedInventoryPage.nav.getCartCount();
    expect(cartCount).toBe(1);

    // Now in cart
    const nowInCart = await firstCard.isInCart();
    expect(nowInCart).toBe(true);

    // Remove from cart
    await firstCard.removeFromCart();
    const finalCount = await authenticatedInventoryPage.nav.getCartCount();
    expect(finalCount).toBe(0);
  });
});

test.describe('Custom Locator Strategies', () => {
  test('@smoke Role-based locator finds login button', async ({ loginPage }) => {
    // Using role-based locator — most resilient
    const loginButton = Locators.byRole(loginPage.page, 'button');
    const isVisible = await loginButton.isVisible();
    expect(isVisible).toBe(true);
  });

  test('@smoke TestId locator finds username field', async ({ loginPage }) => {
    const usernameField = Locators.byTestId(loginPage.page, 'username');
    await expect(usernameField).toBeVisible();
  });

  test('@regression Filter locator finds specific product', async ({
    authenticatedInventoryPage: page,
  }) => {
    const allItems = page.page.locator('.inventory_item');

    // Custom strategy — filter by text
    const backpack = Locators.withText(allItems, 'Sauce Labs Backpack');
    await expect(backpack).toBeVisible();
    await expect(backpack).toHaveCount(1);
  });

  test('@regression nth locator selects correct item', async ({
    authenticatedInventoryPage: page,
  }) => {
    const allItems = page.page.locator('.inventory_item_name');

    // Get second item (index 1)
    const secondItem = Locators.nth(allItems, 1);
    const text = await secondItem.innerText();
    expect(text).toBeTruthy();
  });
});

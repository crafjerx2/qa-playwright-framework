import { test, expect } from '@fixtures/index';

test.describe('Inventory Page — Design Patterns in action', () => {
  test('@smoke Inventory page loads with 6 products', async ({ authenticatedInventoryPage }) => {
    const isLoaded = await authenticatedInventoryPage.isLoaded();
    const count = await authenticatedInventoryPage.getItemCount();
    const title = await authenticatedInventoryPage.getPageTitle();

    expect(isLoaded).toBe(true);
    expect(count).toBe(6);
    expect(title).toBe('Products');
  });
  test('@smoke Product cards have valid data', async ({ authenticatedInventoryPage }) => {
    // POM + Component Pattern: we get typed ProductCard objects
    const cards = await authenticatedInventoryPage.getAllProductCards();

    expect(cards.length).toBe(6);

    // Check first card has valid data
    const firstCard = cards[0];
    const details = await firstCard.getDetails();

    expect(details.name).toBeTruthy();
    expect(details.price).toBeGreaterThan(0);
    expect(details.description).toBeTruthy();
  });
  test('@regression Add product to cart updates badge', async ({ authenticatedInventoryPage }) => {
    // NavigationBar component handles cart count
    const initialCount = await authenticatedInventoryPage.nav.getCartCount();
    expect(initialCount).toBe(0);

    // ProductCard component handles add to cart
    const cards = await authenticatedInventoryPage.getAllProductCards();
    await cards[0].addToCart();

    const updatedCount = await authenticatedInventoryPage.nav.getCartCount();
    expect(updatedCount).toBe(1);
  });

  test('@regression Products sort by price low to high', async ({ authenticatedInventoryPage }) => {
    await authenticatedInventoryPage.sortByPriceLowToHigh();

    const prices = await authenticatedInventoryPage.getPrices();

    // Verify prices are in ascending order
    for (let i = 1; i < prices.length; i++) {
      expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1]);
    }
  });

  test('@regression Can find product by name', async ({ authenticatedInventoryPage }) => {
    const targetName = 'Sauce Labs Backpack';

    // Factory-like method on the page
    const card = await authenticatedInventoryPage.getProductCardByName(targetName);

    expect(card).toBeDefined();
    const details = await card!.getDetails();
    expect(details.name).toBe(targetName);
  });
});

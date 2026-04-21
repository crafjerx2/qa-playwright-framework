/**
 * Tests demonstrating browser management features:
 * - Context isolation between tests
 * - Multi-browser support
 * - Auth state reuse
 * - Mobile context
 */

import { test, expect } from '../../src/fixtures';

test.describe('Browser Management — Context Isolation', () => {
  test('@smoke Each test gets isolated context', async ({ loginPage, standardUser }) => {
    // This test has its own fresh browser context
    // No cookies or storage from other tests
    await loginPage.login(standardUser.username, standardUser.password);
    const url = await loginPage.getCurrentUrl();
    expect(url).toContain('inventory');
  });

  test('@smoke Context is clean — no leftover state', async ({ loginPage }) => {
    // If context were shared, the previous test's login
    // would still be active here. It's NOT — fresh context.
    const url = await loginPage.getCurrentUrl();

    // We're on login page, not inventory — proves isolation
    expect(url).not.toContain('inventory');
    const isLoaded = await loginPage.isLoaded();
    expect(isLoaded).toBe(true);
  });

  test('@smoke Authenticated context loads inventory directly', async ({
    authenticatedInventoryPage,
  }) => {
    // Uses saved auth state — no login needed
    const isLoaded = await authenticatedInventoryPage.isLoaded();
    const title = await authenticatedInventoryPage.getPageTitle();

    expect(isLoaded).toBe(true);
    expect(title).toBe('Products');
  });

  test('@regression Multiple products can be added to cart', async ({
    authenticatedInventoryPage,
  }) => {
    const cards = await authenticatedInventoryPage.getAllProductCards();

    // Add first two products
    await cards[0].addToCart();
    await cards[1].addToCart();

    const cartCount = await authenticatedInventoryPage.nav.getCartCount();
    expect(cartCount).toBe(2);
  });

  test('@regression Cart state does not persist between tests', async ({
    authenticatedInventoryPage,
  }) => {
    // Previous test added 2 items — but that was a different context
    // This test starts with a clean cart
    const cartCount = await authenticatedInventoryPage.nav.getCartCount();
    expect(cartCount).toBe(0);
  });
});

test.describe('Browser Management — Page Factory', () => {
  test('@smoke PageFactory creates correct page instances', async ({ pageFactory }) => {
    const loginPage = pageFactory.createLoginPage();
    await loginPage.navigate();

    const isLoaded = await loginPage.isLoaded();
    expect(isLoaded).toBe(true);
  });

  test('@smoke PageFactory handles authenticated creation', async ({
    pageFactory,
    standardUser,
  }) => {
    const inventoryPage = await pageFactory.createAuthenticatedInventoryPage(
      standardUser.username,
      standardUser.password,
    );

    const isLoaded = await inventoryPage.isLoaded();
    expect(isLoaded).toBe(true);

    const count = await inventoryPage.getItemCount();
    expect(count).toBe(6);
  });
});

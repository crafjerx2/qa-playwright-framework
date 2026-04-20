import { test as base } from '@playwright/test';
import { LoginPage } from '@pages/login/LoginPage';
import { PageFactory } from './PageFactory';
import { InventoryPage } from '@pages/inventory/InventoryPage';
import { TestUser, UserBuilder } from '@data/factories/UserBuilder';
import { TestLogger } from '@utils/Logger';
import { Config } from '@config/ConfigManager';

// Define the shape of our custom fixtures
interface CustomFixtures {
  // Page factories
  pageFactory: PageFactory;

  // Individual pages — created fresh per test
  loginPage: LoginPage;
  inventoryPage: InventoryPage;

  // Pre-authenticated inventory page
  authenticatedInventoryPage: InventoryPage;

  // Test data
  standardUser: TestUser;
  lockedUser: TestUser;
  randomUser: TestUser;
}

export const test = base.extend<CustomFixtures>({
  // ─── PageFactory fixture ────────────────────────────────────
  pageFactory: async ({ page }, use) => {
    const factory = new PageFactory(page);
    await use(factory);
  },

  // ─── LoginPage fixture ───────────────────────────────────────
  loginPage: async ({ page }, use) => {
    TestLogger.step('Fixture: creating LoginPage');
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await use(loginPage);
    TestLogger.step('Fixture: LoginPage teardown');
  },

  // ─── InventoryPage fixture ───────────────────────────────────
  inventoryPage: async ({ page }, use) => {
    TestLogger.step('Fixture: creating inventoryPage');
    const inventoryPage = new InventoryPage(page);
    await use(inventoryPage);
    TestLogger.step('Fixture: inventoryPage teardown');
  },

  // ─── Authenticated fixture ───────────────────────────────────
  // This fixture DEPENDS on pageFactory — DI in action
  authenticatedInventoryPage: async ({ pageFactory }, use) => {
    TestLogger.step('Fixture: creating authenticated session');
    const inventoryPage = await pageFactory.createAuthenticatedInventoryPage(
      Config.testUsername,
      Config.testPassword,
    );

    await use(inventoryPage);
    TestLogger.step('Fixture: authenticated session teardown');
  },
  // ─── Test data fixtures ──────────────────────────────────────

  standardUser: async ({}, use) => {
    const user = UserBuilder.standard().build();
    await use(user);
  },

  lockedUser: async ({}, use) => {
    const user = UserBuilder.locked().build();
    await use(user);
  },

  randomUser: async ({}, use) => {
    const user = UserBuilder.random().build();
    await use(user);
  },
});

// Re-export expect so tests only import from fixtures
export { expect } from '@playwright/test';

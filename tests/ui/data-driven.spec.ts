/**
 * @fileoverview Data-driven tests using test.each, JSON, and CSV.
 *
 * @description
 * Demonstrates three data-driven approaches:
 * 1. test.each with inline data
 * 2. test.each with JSON data
 * 3. test.each with CSV data
 * 4. Faker.js for dynamic data
 *
 * DATA-DRIVEN TESTING benefits:
 * - One test function covers many scenarios
 * - Adding scenarios = adding data, not code
 * - Test names are generated from data descriptions
 * - Failures show exactly which data set failed
 */

import { test, expect } from '../../src/fixtures';
import { TestData } from '../../src/data/TestDataFactory';
import { LoginPage } from '../../src/pages/login/LoginPage';
import { InventoryPage } from '../../src/pages/inventory/InventoryPage';

// ─── Approach 1: test.each with inline data ──────────────────

test.describe('Data-Driven — Inline test.each', () => {
  /**
   * test.each with array of objects.
   * The test name uses values from each object.
   */
  const loginScenarios: Array<{
    username: string;
    password: string;
    expected: string;
    description: string;
  }> = [
    {
      username: 'standard_user',
      password: 'secret_sauce',
      expected: 'success',
      description: 'standard user',
    },
    {
      username: 'locked_out_user',
      password: 'secret_sauce',
      expected: 'error',
      description: 'locked out user',
    },
    {
      username: 'wrong_user',
      password: 'wrong_pass',
      expected: 'error',
      description: 'wrong credentials',
    },
    {
      username: '',
      password: 'secret_sauce',
      expected: 'error',
      description: 'empty username',
    },
  ];
  test.describe('Data-Driven — Dynamic login generation', () => {
    for (const scenario of loginScenarios) {
      test(`@regression Login: ${scenario.description}`, async ({ page }) => {
        const loginPage = new LoginPage(page);
        await loginPage.navigate();
        await loginPage.login(scenario.username, scenario.password);

        if (scenario.expected === 'success') {
          const url = await loginPage.getCurrentUrl();
          expect(url).toContain('inventory');
        } else {
          const hasError = await loginPage.hasValidationError();
          expect(hasError).toBe(true);
        }
      });
    }
  });
});

// ─── Approach 2: test.each with JSON data ────────────────────

test.describe('Data-Driven — JSON data source', () => {
  /**
   * Load all invalid users from JSON and test each one.
   * If you add a new user to users.json, the test runs automatically.
   */
  test('@smoke All valid users can login', async ({ page }) => {
    const validUsers = await TestData.users.validUsers();

    for (const user of validUsers) {
      const loginPage = new LoginPage(page);
      await loginPage.navigate();
      await loginPage.login(user.username, user.password);

      const url = await loginPage.getCurrentUrl();
      expect(url).toContain(user.expectedUrl ?? 'inventory');

      // Go back for next iteration
      await page.goto(process.env['BASE_URL'] ?? 'https://www.saucedemo.com');
    }
  });

  test('@regression All invalid users see error', async ({ page }) => {
    const invalidUsers = await TestData.users.invalidUsers();

    for (const user of invalidUsers) {
      const loginPage = new LoginPage(page);
      await loginPage.navigate();
      await loginPage.login(user.username, user.password);

      const hasError = await loginPage.hasValidationError();
      expect(hasError).toBe(true);

      if (user.expectedError) {
        const errorMsg = await loginPage.getErrorMessage();
        expect(errorMsg.toLowerCase()).toContain(user.expectedError.toLowerCase());
      }
    }
  });

  test('@smoke Products data matches expected count', async ({ authenticatedInventoryPage }) => {
    const expectedProducts = await TestData.products.all();
    const actualCount = await authenticatedInventoryPage.getItemCount();

    expect(actualCount).toBe(expectedProducts.length);
  });

  test('@regression Cheapest product is Onesie', async () => {
    const cheapest = await TestData.products.cheapest();
    expect(cheapest.name).toContain('Onesie');
    expect(cheapest.price).toBe(7.99);
  });

  test('@regression Most expensive product is Fleece Jacket', async () => {
    const mostExpensive = await TestData.products.mostExpensive();
    expect(mostExpensive.name).toContain('Fleece Jacket');
    expect(mostExpensive.price).toBe(49.99);
  });
});

// ─── Approach 3: test.each with CSV data ─────────────────────

test.describe('Data-Driven — CSV data source', () => {
  /**
   * Loads scenarios from CSV and runs each as a separate test.
   * This runs before the describe block executes tests.
   */
  test('@smoke CSV login scenarios load correctly', async () => {
    const scenarios = await TestData.csv.loginScenarios();
    expect(scenarios.length).toBeGreaterThan(0);
    expect(scenarios[0]).toHaveProperty('username');
    expect(scenarios[0]).toHaveProperty('password');
    expect(scenarios[0]).toHaveProperty('expectedResult');
  });

  test('@regression Successful CSV login scenarios work', async ({ page }) => {
    const successScenarios = await TestData.csv.successfulLogins();

    for (const scenario of successScenarios) {
      const loginPage = new LoginPage(page);
      await loginPage.navigate();
      await loginPage.login(scenario.username, scenario.password);

      const url = await loginPage.getCurrentUrl();
      expect(url).toContain('inventory');

      await page.goto(process.env['BASE_URL'] ?? 'https://www.saucedemo.com');
    }
  });

  test('@regression Failed CSV login scenarios show errors', async ({ page }) => {
    const errorScenarios = await TestData.csv.failedLogins();

    for (const scenario of errorScenarios) {
      const loginPage = new LoginPage(page);
      await loginPage.navigate();
      await loginPage.login(scenario.username, scenario.password);

      const hasError = await loginPage.hasValidationError();
      expect(hasError).toBe(true);

      if (scenario.expectedError) {
        const errorMsg = await loginPage.getErrorMessage();
        expect(errorMsg.toLowerCase()).toContain(scenario.expectedError.toLowerCase());
      }
    }
  });

  test('@regression Sort CSV scenarios match expected order', async ({
    authenticatedInventoryPage,
  }) => {
    const sortScenarios = await TestData.csv.sortScenarios();

    for (const scenario of sortScenarios) {
      await authenticatedInventoryPage.sortDropdown.selectByValue(scenario.sortOption);

      const names = await authenticatedInventoryPage.getItemNames();

      expect(names[0]).toBe(scenario.expectedFirst);
      expect(names[names.length - 1]).toBe(scenario.expectedLast);
    }
  });
});

// ─── Approach 4: Faker.js dynamic data ───────────────────────

test.describe('Data-Driven — Faker.js dynamic data', () => {
  test('@regression Random user always fails login', async ({ loginPage, randomUser }) => {
    // randomUser comes from our fixture — always invalid
    await loginPage.login(randomUser.username, randomUser.password);

    const hasError = await loginPage.hasValidationError();
    expect(hasError).toBe(true);
  });

  test('@smoke Faker generates unique users each run', async () => {
    const user1 = TestData.fake.user();
    const user2 = TestData.fake.user();

    // Should be different users
    expect(user1.username).not.toBe(user2.username);
    expect(user1.email).not.toBe(user2.email);
  });

  test('@smoke Faker checkout info has required fields', async () => {
    const checkoutInfo = TestData.fake.checkoutInfo();

    expect(checkoutInfo.firstName).toBeTruthy();
    expect(checkoutInfo.lastName).toBeTruthy();
    expect(checkoutInfo.postalCode).toBeTruthy();
  });

  test('@smoke Faker generates multiple unique users', async () => {
    const users = TestData.fake.users(5);

    expect(users).toHaveLength(5);

    // All usernames should be unique
    const usernames = users.map((u) => u.username);
    const unique = new Set(usernames);
    expect(unique.size).toBe(5);
  });
});

// ─── Approach 5: Parametrized test.each with JSON ────────────

test.describe('Data-Driven — Sort scenarios parametrized', () => {
  /**
   * Pre-load data for test.each.
   * Note: test.each needs synchronous data,
   * so we define the scenarios inline here.
   */
  const sortScenarios: Array<{
    sortOption: string;
    label: string;
    expectedFirst: string;
    expectedLast: string;
  }> = [
    {
      sortOption: 'az' as const,
      label: 'A to Z',
      expectedFirst: 'Sauce Labs Backpack',
      expectedLast: 'Test.allTheThings() T-Shirt (Red)',
    },
    {
      sortOption: 'za' as const,
      label: 'Z to A',
      expectedFirst: 'Test.allTheThings() T-Shirt (Red)',
      expectedLast: 'Sauce Labs Backpack',
    },
    {
      sortOption: 'lohi' as const,
      label: 'Price low to high',
      expectedFirst: 'Sauce Labs Onesie',
      expectedLast: 'Sauce Labs Fleece Jacket',
    },
    {
      sortOption: 'hilo' as const,
      label: 'Price high to low',
      expectedFirst: 'Sauce Labs Fleece Jacket',
      expectedLast: 'Sauce Labs Onesie',
    },
  ];

  for (let sort of sortScenarios) {
    const { label, sortOption, expectedFirst, expectedLast } = sort;
    test(`@regression Sort by ${label} shows correct order`, async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.navigate();
      await loginPage.login('standard_user', 'secret_sauce');

      const inventoryPage = new InventoryPage(page);
      await inventoryPage.sortDropdown.selectByValue(sortOption);

      const names = await inventoryPage.getItemNames();
      expect(names[0]).toBe(expectedFirst);
      expect(names[names.length - 1]).toBe(expectedLast);
    });
  }
});

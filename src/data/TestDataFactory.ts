/**
 * @fileoverview Central factory for all test data access.
 *
 * @description
 * Single entry point for all test data in the framework.
 * Combines JSON, CSV, and Faker data sources.
 *
 * FACADE PATTERN: Hides the complexity of multiple data sources.
 * FACTORY PATTERN: Creates and returns data objects.
 *
 * @example
 * // In tests — single import for all data needs:
 * import { TestData } from '../../src/data/TestDataFactory';
 *
 * const users = await TestData.users.validUsers();
 * const scenario = await TestData.csv.loginScenario('TC001');
 * const fakeUser = TestData.fake.user();
 */

import { JsonDataProvider } from './providers/JsonDataProvider';
import { CsvDataProvider } from './providers/CsvDataProvider';
import { UserBuilder } from './factories/UserBuilder';
import { ProductBuilder } from './factories/ProductBuilder';
import { faker } from '@faker-js/faker';

// ─── Data interfaces ──────────────────────────────────────────

export interface UserData {
  id: string;
  username: string;
  password: string;
  role: string;
  description: string;
  expectedResult: string;
  expectedUrl?: string;
  expectedError?: string;
}

export interface ProductData {
  id: string;
  name: string;
  price: number;
  priceText: string;
  description: string;
  category: string;
}

export interface SortScenarioData {
  id: string;
  sortOption: string;
  label: string;
  description: string;
  expectedFirst: string;
  expectedLast: string;
}

export interface CheckoutData {
  id: string;
  firstName: string;
  lastName: string;
  postalCode: string;
  description: string;
  expectedError?: string;
}

export interface CsvLoginScenario {
  [key: string]: string;
  id: string;
  username: string;
  password: string;
  expectedResult: string;
  expectedError: string;
  description: string;
}

export interface CsvSortScenario {
  [key: string]: string;
  id: string;
  sortOption: string;
  label: string;
  expectedFirst: string;
  expectedLast: string;
  description: string;
}

// ─── JSON Providers ───────────────────────────────────────────

const usersJson = new JsonDataProvider<UserData>('users.json', 'validUsers');
const invalidUsersJson = new JsonDataProvider<UserData>('users.json', 'invalidUsers');
const productsJson = new JsonDataProvider<ProductData>('products.json', 'allProducts');
const sortScenariosJson = new JsonDataProvider<SortScenarioData>('products.json', 'sortScenarios');
const validCheckoutJson = new JsonDataProvider<CheckoutData>('checkout.json', 'validCheckout');
const invalidCheckoutJson = new JsonDataProvider<CheckoutData>('checkout.json', 'invalidCheckout');

// ─── CSV Providers ────────────────────────────────────────────

const loginCsv = new CsvDataProvider<CsvLoginScenario>('login-scenarios.csv');
const sortCsv = new CsvDataProvider<CsvSortScenario>('sort-scenarios.csv');

// ─── TestData facade ──────────────────────────────────────────

export const TestData = {
  /**
   * JSON-based user data
   */
  users: {
    validUsers: () => usersJson.getAll(),
    invalidUsers: () => invalidUsersJson.getAll(),
    validUserById: (id: string) => usersJson.getById(id),
    randomValidUser: () => usersJson.getRandom(),
  },

  /**
   * JSON-based product data
   */
  products: {
    all: () => productsJson.getAll(),
    byId: (id: string) => productsJson.getById(id),
    sortScenarios: () => sortScenariosJson.getAll(),
    cheapest: async () => {
      const products = await productsJson.getAll();
      return products.reduce((min, p) => (p.price < min.price ? p : min));
    },
    mostExpensive: async () => {
      const products = await productsJson.getAll();
      return products.reduce((max, p) => (p.price > max.price ? p : max));
    },
  },

  /**
   * JSON-based checkout data
   */
  checkout: {
    valid: () => validCheckoutJson.getAll(),
    invalid: () => invalidCheckoutJson.getAll(),
    validById: (id: string) => validCheckoutJson.getById(id),
  },

  /**
   * CSV-based scenarios
   */
  csv: {
    loginScenarios: () => loginCsv.getAll(),
    loginScenario: (id: string) => loginCsv.getById(id),
    sortScenarios: () => sortCsv.getAll(),
    successfulLogins: () => loginCsv.filter((row) => row.expectedResult === 'success'),
    failedLogins: () => loginCsv.filter((row) => row.expectedResult === 'error'),
  },

  /**
   * Faker.js dynamic data
   */
  fake: {
    /**
     * Generates a random user with fake credentials.
     * Always produces invalid credentials for SauceDemo.
     */
    user: () => UserBuilder.random().build(),

    /**
     * Generates a random product.
     */
    product: () => ProductBuilder.random().build(),

    /**
     * Generates random checkout form data.
     */
    checkoutInfo: () => ({
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      postalCode: faker.location.zipCode(),
    }),

    /**
     * Generates a random email address.
     */
    email: () => faker.internet.email(),

    /**
     * Generates a random strong password.
     */
    password: () => faker.internet.password({ length: 12 }),

    /**
     * Generates N random users.
     *
     * @param count - Number of users to generate
     */
    users: (count: number) => Array.from({ length: count }, () => UserBuilder.random().build()),
  },
};

/**
 * @fileoverview Framework-wide constants.
 *
 * SINGLE RESPONSIBILITY: Only stores constant values.
 * No logic, no state, just named constants.
 *
 * Why constants instead of magic strings?
 * - Typos are caught at compile time, not runtime
 * - Renaming is safe with IDE refactoring
 * - Self-documenting code
 *
 * @example
 * // BAD - magic string
 * await page.waitForSelector('.shopping_cart_badge');
 *
 * // GOOD - named constant
 * await page.waitForSelector(Selectors.CART_BADGE);
 */

/**
 * CSS selectors used across the framework.
 * Centralizing selectors means one change point if UI changes.
 */
export const Selectors = {
  // Login Page
  LOGIN: {
    USERNAME: '[data-test="username"]',
    PASSWORD: '[data-test="password"]',
    BUTTON: '[data-test="login-button"]',
    ERROR: '[data-test="error"]',
    LOGO: '.login_logo',
  },

  // Navigation
  NAV: {
    CART_ICON: '.shopping_cart_link',
    CART_BADGE: '.shopping_cart_badge',
    HAMBURGER: '#react-burger-menu-btn',
    LOGOUT: '#logout_sidebar_link',
    ALL_ITEMS: '#inventory_sidebar_link',
  },

  // Inventory Page
  INVENTORY: {
    TITLE: '.title',
    ITEMS: '.inventory_item',
    ITEM_NAME: '.inventory_item_name',
    ITEM_PRICE: '.inventory_item_price',
    ITEM_DESC: '.inventory_item_desc',
    ADD_TO_CART: '[data-test^="add-to-cart"]',
    REMOVE: '[data-test^="remove"]',
    SORT_DROPDOWN: '[data-test="product-sort-container"]',
  },
} as const;

/**
 * URL paths for navigation.
 */
export const Routes = {
  HOME: '/',
  INVENTORY: '/inventory.html',
  CART: '/cart.html',
  CHECKOUT_STEP_ONE: '/checkout-step-one.html',
  CHECKOUT_STEP_TWO: '/checkout-step-two.html',
  CHECKOUT_COMPLETE: '/checkout-complete.html',
} as const;

/**
 * Timeout values in milliseconds.
 * Named timeouts are self-documenting.
 */
export const Timeouts = {
  SHORT: 3_000,
  DEFAULT: 10_000,
  LONG: 30_000,
  ANIMATION: 300,
  PAGE_LOAD: 30_000,
  API_REQUEST: 15_000,
} as const;

/**
 * Test categories for tagging and filtering.
 * Use these with @smoke, @regression tags in test names.
 */
export const TestTags = {
  SMOKE: '@smoke',
  REGRESSION: '@regression',
  E2E: '@e2e',
  API: '@api',
  VISUAL: '@visual',
} as const;

/**
 * SauceDemo specific test data.
 */
export const SauceDemo = {
  PRODUCTS: {
    BACKPACK: 'Sauce Labs Backpack',
    BIKE_LIGHT: 'Sauce Labs Bike Light',
    BOLT_SHIRT: 'Sauce Labs Bolt T-Shirt',
    FLEECE_JACKET: 'Sauce Labs Fleece Jacket',
    ONESIE: 'Sauce Labs Onesie',
    RED_SHIRT: 'Test.allTheThings() T-Shirt (Red)',
    TOTAL_COUNT: 6,
  },
  SORT_OPTIONS: {
    AZ: 'az',
    ZA: 'za',
    LOW_HIGH: 'lohi',
    HIGH_LOW: 'hilo',
  },
} as const;

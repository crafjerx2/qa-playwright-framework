/**
 * @fileoverview Custom locator strategies extending Playwright's built-in locators.
 *
 * @description
 * Playwright's built-in locators are already excellent.
 * These custom strategies add domain-specific and semantic locators
 * that make tests more readable and resilient.
 *
 * ## Why custom locators?
 * - Standard: page.locator('[data-test="username"]')  → fragile if attribute changes
 * - Custom:   Locators.byTestId(page, 'username')     → resilient, semantic
 *
 * ## Locator Priority (best to worst):
 * 1. Role-based (getByRole) — most resilient, accessibility-friendly
 * 2. Text-based (getByText) — readable, visible to users
 * 3. Test ID (data-test) — explicit test contract
 * 4. CSS selector — last resort
 *
 * @example
 * const button = Locators.byRole(page, 'button', 'Add to cart');
 * const input = Locators.byTestId(page, 'username');
 * const heading = Locators.byHeading(page, 'Products');
 */
import { Page, Locator, FrameLocator } from '@playwright/test';

/**
 * ARIA role types supported by Playwright.
 */
export type AriaRole =
  | 'button'
  | 'link'
  | 'checkbox'
  | 'radio'
  | 'textbox'
  | 'combobox'
  | 'listbox'
  | 'option'
  | 'menu'
  | 'menuitem'
  | 'dialog'
  | 'alert'
  | 'heading'
  | 'img'
  | 'list'
  | 'listitem'
  | 'navigation'
  | 'main'
  | 'form'
  | 'table'
  | 'row'
  | 'cell';

/**
 * @class Locators
 * @description Static utility class providing semantic locator strategies.
 *
 * Only creates locators — no interactions.
 * All methods are pure functions — same input → same locator.
 */
export class Locators {
  // ─── Role-based locators (most resilient) ────────────────────
  /**
   * Finds element by ARIA role and optional accessible name.
   * Most resilient strategy — survives CSS/attribute changes.
   *
   * @param page - Playwright Page or Locator context
   * @param role - ARIA role (button, link, checkbox, etc.)
   * @param name - Accessible name (button text, label, etc.)
   *
   * @example
   * const loginBtn = Locators.byRole(page, 'button', 'Login');
   * const usernameField = Locators.byRole(page, 'textbox', 'Username');
   */
  static byRole(page: Page | Locator, role: AriaRole, name?: string): Locator {
    return name
      ? page.getByRole(role as Parameters<typeof page.getByRole>[0], { name })
      : page.getByRole(role as Parameters<typeof page.getByRole>[0]);
  }

  // ─── Text-based locators ─────────────────────────────────────
  /**
   * Finds element by exact visible text.
   *
   * @param page - Playwright Page or Locator context
   * @param text - Exact text to match
   * @param exact - Whether to match exactly (default: true)
   *
   * @example
   * const title = Locators.byText(page, 'Products');
   * const partial = Locators.byText(page, 'Add to', false);
   */
  static byText(page: Page | Locator, text: string, exact: boolean = true): Locator {
    return page.getByText(text, { exact });
  }

  /**
   * Finds heading element by text.
   *
   * @param page - Playwright Page or Locator context
   * @param text - Heading text
   * @param level - Heading level (1-6), optional
   */
  static byHeading(page: Page | Locator, text: string, level?: 1 | 2 | 3 | 4 | 5 | 6): Locator {
    return page.getByRole('heading', {
      name: text,
      level,
    });
  }

  // ─── Test ID locators ────────────────────────────────────────
  /**
   * Finds element by data-test attribute.
   * Most explicit strategy for test automation.
   *
   * @param page - Playwright Page or Locator context
   * @param testId - Value of the data-test attribute
   *
   * @example
   * const input = Locators.byTestId(page, 'username');
   * Finds: <input data-test="username" />
   */
  static byTestId(page: Page | Locator, testId: string): Locator {
    return page.getByTestId(testId);
  }

  /**
   * Finds element by data-test attribute that starts with a prefix.
   * Useful for dynamic test IDs like "add-to-cart-sauce-labs-backpack".
   *
   * @param page - Playwright Page or Locator context
   * @param prefix - Prefix of the data-test attribute value
   *
   * @example
   * const addBtn = Locators.byTestIdPrefix(page, 'add-to-cart');
   * Finds: <button data-test="add-to-cart-sauce-labs-backpack" />
   */
  static byTestIdPrefix(page: Page | Locator, prefix: string): Locator {
    return page.locator(`[data-test^="${prefix}"]`);
  }

  // ─── Label-based locators ────────────────────────────────────
  /**
   * Finds form field by its associated label text.
   * Very readable — mirrors how users identify fields.
   *
   * @example
   * const emailField = Locators.byLabel(page, 'Email address');
   */
  static byLabel(page: Page | Locator, label: string, exact: boolean = true): Locator {
    return page.getByLabel(label, { exact });
  }

  // ─── Placeholder locators ────────────────────────────────────

  /**
   * Finds input by its placeholder text.
   *
   * @example
   * const searchInput = Locators.byPlaceholder(page, 'Search...');
   */
  static byPlaceholder(page: Page | Locator, placeholder: string): Locator {
    return page.getByPlaceholder(placeholder);
  }

  // ─── CSS/XPath locators (use as last resort) ─────────────────

  /**
   * Finds element by CSS selector.
   * Use only when semantic locators are not available.
   *
   * @param page - Playwright Page or Locator context
   * @param selector - CSS selector string
   */
  static byCSS(page: Page | Locator, selector: string): Locator {
    return page.locator(selector);
  }

  /**
   * Finds element by XPath expression.
   * Last resort — prefer all other strategies.
   *
   * @param page - Playwright Page or Locator context
   * @param xpath - XPath expression
   *
   * @example
   * const cell = Locators.byXPath(page, '//table//tr[2]/td[1]');
   */
  static byXPath(page: Page | Locator, xpath: string): Locator {
    return page.locator(`xpath=${xpath}`);
  }

  // ─── Composite locators ──────────────────────────────────────
  /**
   * Finds nth element matching a locator (0-based index).
   *
   * @param locator - Base locator to index into
   * @param index - Zero-based index
   *
   * @example
   * const firstProduct = Locators.nth(productLocators, 0);
   * const secondProduct = Locators.nth(productLocators, 1);
   */
  static nth(locator: Locator, index: number): Locator {
    return locator.nth(index);
  }
  /**
   * Finds the first element matching a locator.
   */
  static first(locator: Locator): Locator {
    return locator.first();
  }

  /**
   * Finds the last element matching a locator.
   */
  static last(locator: Locator): Locator {
    return locator.last();
  }

  /**
   * Filters a locator to only elements containing specific text.
   *
   * @param locator - Base locator to filter
   * @param text - Text that filtered elements must contain
   *
   * @example
   * const backpackCard = Locators.withText(productCards, 'Sauce Labs Backpack');
   */
  static withText(locator: Locator, text: string): Locator {
    return locator.filter({ hasText: text });
  }

  /**
   * Filters a locator to only elements containing a child element.
   *
   * @param locator - Base locator to filter
   * @param childLocator - Child that filtered elements must have
   */
  static withChild(locator: Locator, childLocator: Locator): Locator {
    return locator.filter({ has: childLocator });
  }

  // ─── Frame locators ──────────────────────────────────────────

  /**
   * Gets a FrameLocator for working inside iframes.
   *
   * @param page - Playwright Page
   * @param frameSelector - CSS selector or name of the iframe
   *
   * @example
   * const frame = Locators.frame(page, '#payment-iframe');
   * const cardInput = Locators.byLabel(frame, 'Card number');
   */
  static frame(page: Page, frameSelector: string): FrameLocator {
    return page.frameLocator(frameSelector);
  }
}

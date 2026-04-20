/**
 * @fileoverview Page interface definitions following Interface Segregation Principle.
 *
 * @description
 * Instead of one large IPage interface, we define small, focused interfaces.
 * Each page implements only the interfaces that match its actual capabilities.
 *
 * ## Interface Segregation Principle (ISP)
 * A class should not be forced to implement interfaces it does not use.
 *
 * ## Usage
 * ```typescript
 * // LoginPage implements: IBasePage, INavigable, IAuthenticatable, IFormInteractable
 * // InventoryPage implements: IBasePage, INavigable, IListable
 * // CartPage implements: IBasePage, INavigable, IListable
 * ```
 *
 * ## Dependency Inversion
 * Tests and utilities that accept these interfaces are decoupled
 * from concrete implementations. You can swap LoginPage for a
 * MockLoginPage without changing test code.
 */

import { Page } from '@playwright/test';

/**
 * Contract for pages that can verify their own load state.
 * All Page Objects should implement this.
 */
export interface IPageLoadable {
  /**
   * Checks if the page has loaded successfully.
   * Each page defines its own success condition.
   * @returns true if the page is fully loaded and ready for interaction
   */
  isLoaded(): Promise<boolean>;

  /**
   * Waits until the page is fully loaded.
   * @throws Error if page fails to load within timeout
   */
  waitForLoad(): Promise<void>;
}

/**
 * Contract for pages that can be navigated to via URL.
 * Not all pages are directly navigable (e.g., modal dialogs).
 */
export interface INavigable {
  /**
   * Navigates to this page's URL.
   * @param url - Optional override URL
   */
  navigate(url?: string): Promise<void>;

  /**
   * Returns the current URL.
   * @returns Current URL string
   */
  getCurrentUrl(): string;
}

/**
 * Contract for pages with authentication actions.
 * Only pages involved in auth flows implement this.
 */
export interface IAuthenticatable {
  /**
   * Performs login with the provided credentials.
   * @param username - Account username
   * @param password - Account password
   */
  login(username: string, password: string): Promise<void>;

  /**
   * Logs out the current user.
   */
  logout(): Promise<void>;

  /**
   * Checks if a user is currently authenticated.
   * @returns true if the user is logged in
   */
  isAuthenticated(): boolean;
}

/**
 * Contract for pages containing interactive forms.
 * Login, checkout, and registration pages implement this.
 */
export interface IFormInteractable {
  /**
   * Fills a form field identified by its selector.
   * @param selector - CSS selector of the target input
   * @param value - Value to enter in the field
   */
  fillField(selector: string, value: string): Promise<void>;

  /**
   * Submits the form (e.g., clicks submit button).
   */
  submitForm(): Promise<void>;

  /**
   * Gets the current value of a form field.
   * @param selector - CSS selector of the input field
   * @returns Current field value
   */
  getFieldValue(selector: string): Promise<string>;

  /**
   * Checks if any validation error is currently displayed.
   * @returns true if a validation error is visible
   */
  hasValidationError(): Promise<boolean>;
}

/**
 * Contract for pages that display collections of items.
 * Inventory, cart, and search results pages implement this.
 */
export interface IListable {
  /**
   * Returns the count of items currently displayed.
   * @returns Number of visible items
   */
  getItemCount(): Promise<number>;

  /**
   * Returns the display names of all visible items.
   * @returns Array of item name strings
   */
  getItemNames(): Promise<string[]>;

  /**
   * Selects an item by its position in the list (0-based).
   * @param index - Zero-based index of the item to select
   */
  selectItemByIndex(index: number): Promise<void>;
}

/**
 * Contract for pages with search functionality.
 * Search results and filter-capable pages implement this.
 */
export interface ISearchable {
  /**
   * Performs a search with the given query.
   * @param query - Search string to enter
   */
  search(query: string): Promise<void>;

  /**
   * Returns the current search results.
   * @returns Array of result strings
   */
  getSearchResults(): Promise<string[]>;

  /**
   * Clears the current search query and results.
   */
  clearSearch(): Promise<void>;
}

/**
 * Base contract that every page must fulfill.
 * The minimum requirement for all Page Objects.
 */
export interface IBasePage {
  /**
   * Returns the browser tab title.
   * @returns Current page title
   */
  readonly page: Page;

  /**
   * Returns the current browser URL.
   * @returns Current URL string
   */
  getTitle(): Promise<string>;
}

/**
 * Now each page implements ONLY what it needs:
 *
 * LoginPage implements: IBasePage, INavigable, IPageLoadable, IFormInteractable
 * InventoryPage implements: IBasePage, IPageLoadable, IListable, ISearchable
 * CartPage implements: IBasePage, IPageLoadable, IListable
 *
 * No page is forced to implement methods it does not use.
 */

/**
 * INTERFACE SEGREGATION PRINCIPLE
 *
 * Instead of ONE big IPage interface with everything,
 * we have SMALL focused interfaces.
 * A class only implements what it actually needs.
 *
 * BAD example (what we avoid):
 * interface IPage {
 *   navigate(): void        // not all pages need navigation
 *   login(): void           // only login page needs this
 *   logout(): void          // only authenticated pages need this
 *   fillForm(): void        // not all pages have forms
 *   getTableData(): void    // only pages with tables need this
 * }
 *
 * GOOD example (what we do):
 */
import { Page } from '@playwright/test';

// Every page can verify it loaded correctly
export interface IPageLoadable {
  isLoaded(): Promise<boolean>;
  waitForLoad(): Promise<void>;
}

// Pages that require navigation to a URL
export interface INavigable {
  navigate(url?: string): Promise<void>;
  getCurrentUrl(): Promise<string>;
}

// Pages with authentication actions
export interface IAuthenticatable {
  login(username: string, password: string): Promise<void>;
  logout(): Promise<void>;
  isAuthenticated(): Promise<boolean>;
}

// Pages with forms
export interface IFormInteractable {
  fillField(selector: string, value: string): Promise<void>;
  submitForm(): Promise<void>;
  getFieldValue(selector: string): Promise<string>;
  hasValidationError(): Promise<boolean>;
}

// Pages that display data lists
export interface IListable {
  getItemCount(): Promise<number>;
  getItemNames(): Promise<string[]>;
  selectItemByIndex(index: number): Promise<void>;
}

// Pages with search capability
export interface ISearchable {
  search(query: string): Promise<void>;
  getSearchResults(): Promise<string[]>;
  clearSearch(): Promise<void>;
}

// Base interface every page has
export interface IBasePage {
  readonly page: Page;
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

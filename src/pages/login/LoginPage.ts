/**
 * @fileoverview Page Object for the SauceDemo login page.
 *
 * @description
 * LoginPage encapsulates all interactions with the login screen.
 * Tests interact with this class — never with raw Playwright APIs.
 *
 * ## Design Patterns Applied
 * - **Page Object Model**: Encapsulates page structure and behavior
 * - **Fluent Interface**: Methods return `this` to enable chaining
 *
 * ## SOLID Principles
 * - **S** - Only responsible for login page interactions
 * - **L** - Honors BasePage contract (isLoaded, getCurrentUrl, etc.)
 * - **I** - Implements only relevant interfaces (INavigable, IAuthenticatable)
 *
 * ## Interfaces Implemented
 * - `INavigable` - Can navigate to its URL
 * - `IAuthenticatable` - Can perform login/logout
 * - `IFormInteractable` - Has form interaction methods
 *
 * @example
 * // Basic usage in a test:
 * const loginPage = new LoginPage(page);
 * await loginPage.navigate();
 * await loginPage.login('standard_user', 'secret_sauce');
 *
 * // Fluent interface:
 * await (await loginPage.open()).login(user.username, user.password);
 */

import { BasePage } from '@pages/base/BasePage';
import { IAuthenticatable, IFormInteractable, INavigable } from '@pages/base/interfaces';
import { Locator, Page } from '@playwright/test';
import { TestLogger } from '@utils/Logger';
import { Selectors, Routes } from '@config/Constants';

export class LoginPage extends BasePage implements INavigable, IAuthenticatable, IFormInteractable {
  private readonly usernameInput: Locator;
  private readonly passwordInput: Locator;
  private readonly loginButton: Locator;
  private readonly errorContainer: Locator;
  private readonly loginLogo: Locator;

  constructor(page: Page) {
    super(page);

    // Define locators in constructor
    this.usernameInput = page.locator(Selectors.LOGIN.USERNAME);
    this.passwordInput = page.locator(Selectors.LOGIN.PASSWORD);
    this.loginButton = page.locator(Selectors.LOGIN.BUTTON);
    this.errorContainer = page.locator(Selectors.LOGIN.ERROR);
    this.loginLogo = page.locator(Selectors.LOGIN.LOGO);
  }

  /**
   * Determines if the login page is fully loaded.
   * Condition: the login logo must be visible.
   *
   * @returns Promise resolving to true if the page is loaded
   */
  async isLoaded(): Promise<boolean> {
    return this.isVisible(this.loginLogo);
  }

  /**
   * Navigates to the login page and waits for it to load.
   *
   * @example
   * await loginPage.navigate();
   */
  async navigate(): Promise<void> {
    await this.navigateTo(Routes.HOME);
    await this.waitForLoad();
  }

  /**
   * Performs the full login flow: enters credentials and submits.
   *
   * @param username - The username to log in with
   * @param password - The password to log in with
   *
   * @example
   * await loginPage.login('standard_user', 'secret_sauce');
   */
  async login(username: string, password: string): Promise<void> {
    await this.fillField(Selectors.LOGIN.USERNAME, username);
    await this.fillField(Selectors.LOGIN.PASSWORD, password);
    await this.submitForm();
  }

  /**
   * Logs out by navigating to the home page.
   * Note: Full logout is handled by NavigationBar component.
   */
  async logout(): Promise<void> {
    await this.navigateTo('/');
  }
  /**
   * Checks if the user is currently authenticated.
   * @returns Promise resolving to true if on the inventory page
   */
  isAuthenticated(): boolean {
    const url = this.getCurrentUrl();
    return url.includes('inventory');
  }

  /**
   * Fills a form field by selector.
   * Routes to the correct locator based on the selector string.
   *
   * @param selector - CSS selector identifying the field
   * @param value - Value to fill in the field
   */
  async fillField(_selector: string, value: string): Promise<void> {
    // Smart implementation — knows which field based on context
    if (_selector.includes('username')) {
      await this.typeText(this.usernameInput, value);
    } else if (_selector.includes('password')) {
      await this.typeText(this.passwordInput, value);
    }
  }

  /**
   * Submits the login form by clicking the login button.
   */
  async submitForm(): Promise<void> {
    await this.clickElement(this.loginButton);
  }

  /**
   * Gets the current value of a form field.
   *
   * @param selector - CSS selector of the input field
   * @returns Promise resolving to the field's current value
   */
  async getFieldValue(selector: string): Promise<string> {
    return this.page.locator(selector).inputValue();
  }

  /**
   * Checks if a validation error message is currently visible.
   *
   * @returns Promise resolving to true if an error is displayed
   */
  async hasValidationError(): Promise<boolean> {
    return this.isVisible(this.errorContainer);
  }

  /**
   * Gets the text content of the error message container.
   * Call after a failed login attempt.
   *
   * @returns Promise resolving to the error message text
   *
   * @example
   * await loginPage.login('wrong', 'wrong');
   * const error = await loginPage.getErrorMessage();
   * expect(error).toContain('Username and password do not match');
   */
  async getErrorMessage(): Promise<string> {
    return this.getText(this.errorContainer);
  }

  /**
   * Opens the login page and returns this instance for chaining.
   * Enables fluent interface pattern.
   *
   * @returns Promise resolving to this LoginPage instance
   *
   * @example
   * const page = await loginPage.open();
   * await page.login(user.username, user.password);
   */
  async open(): Promise<LoginPage> {
    await this.navigate();
    return this;
  }
}

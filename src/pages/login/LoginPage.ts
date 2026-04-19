import { BasePage } from '@pages/base/BasePage';
import { IAuthenticatable, IFormInteractable, INavigable } from '@pages/base/interfaces';
import { Locator, Page } from '@playwright/test';
import { TestLogger } from '@utils/Logger';

export class LoginPage extends BasePage implements INavigable, IAuthenticatable, IFormInteractable {
  private readonly usernameInput: Locator;
  private readonly passwordInput: Locator;
  private readonly loginButton: Locator;
  private readonly errorContainer: Locator;
  private readonly loginLogo: Locator;

  constructor(page: Page) {
    super(page);

    // Define locators in constructor
    this.usernameInput = page.locator('[data-test="username"]');
    this.passwordInput = page.locator('[data-test="password"]');
    this.loginButton = page.locator('[data-test="login-button"]');
    this.errorContainer = page.locator('[data-test="error"]');
    this.loginLogo = page.locator('.login_logo');
  }

  async navigate(url?: string): Promise<void> {
    const currentUrl = url ?? '';
    await this.page.goto(currentUrl);
  }

  async isLoaded(): Promise<boolean> {
    return this.isVisible(this.loginLogo);
  }

  async login(username: string, password: string): Promise<void> {
    TestLogger.step(`Logging in as: ${username}`);
    await this.fillField('[data-test="username"]', username);
    await this.fillField('[data-test="password"]', password);
    await this.submitForm();
  }

  async fillField(_selector: string, value: string): Promise<void> {
    // Smart implementation — knows which field based on context
    if (_selector.includes('username')) {
      await this.typeText(this.usernameInput, value);
    } else if (_selector.includes('password')) {
      await this.typeText(this.passwordInput, value);
    }
  }

  async submitForm(): Promise<void> {
    TestLogger.step('Clicking login button');
    await this.clickElement(this.loginButton);
  }

  async logout(): Promise<void> {
    // Logout is handled from the inventory page
    // LoginPage satisfies the interface but delegates
    TestLogger.step('Logout called on LoginPage — navigating to home');
    await this.navigateTo('/');
  }

  async isAuthenticated(): Promise<boolean> {
    return !(await this.page.url().includes('inventory'));
  }

  async getFieldValue(selector: string): Promise<string> {
    return this.page.locator(selector).inputValue();
  }

  async hasValidationError(): Promise<boolean> {
    return this.isVisible(this.errorContainer);
  }

  async getErrorMessage(): Promise<string> {
    return this.getText(this.errorContainer);
  }

  async open(): Promise<LoginPage> {
    await this.navigateTo();
    return this;
  }
}

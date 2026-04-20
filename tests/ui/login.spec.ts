import { test, expect } from '@playwright/test';
import { LoginPage } from '../../src/pages/login/LoginPage';
import { Config } from '../../src/config/ConfigManager';

test.describe('Login Page test suite ', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.navigate();
  });

  test('@smoke Login page loads correctly', async () => {
    // Tests read like plain English
    // No locators, no waits, no browser setup
    const isLoaded = await loginPage.isLoaded();
    const title = await loginPage.getTitle();

    expect(isLoaded).toBe(true);
    expect(title).toContain('Swag Labs');
  });

  test('@smoke Successful login redirects to inventory', async () => {
    await loginPage.login(Config.testUsername, Config.testPassword);

    const url = loginPage.getCurrentUrl();
    expect(url).toContain('inventory');
  });

  test('@regression Invalid credentials shows error', async () => {
    await loginPage.login('wrong_user', 'wrong_password');

    const hasError = await loginPage.hasValidationError();
    const errorMessage = await loginPage.getErrorMessage();

    expect(hasError).toBe(true);
    expect(errorMessage).toContain('Username and password do not match');
  });

  test('@regression Empty username shows error', async () => {
    await loginPage.login('', Config.testPassword);

    const hasError = await loginPage.hasValidationError();
    expect(hasError).toBe(true);
  });

  test('@regression Empty password shows error', async () => {
    await loginPage.login(Config.testUsername, '');

    const hasError = await loginPage.hasValidationError();
    expect(hasError).toBe(true);
  });
});

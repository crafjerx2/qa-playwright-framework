import { UserBuilder } from '@data/factories/UserBuilder';
import { test, expect } from '@fixtures/index';

test.describe('Login — Builder Pattern for test data', () => {
  test('@smoke Standard user can login', async ({ loginPage }) => {
    // Builder Pattern: creates a standard user
    const user = UserBuilder.standard().build();

    await loginPage.login(user.username, user.password);
    const url = loginPage.getCurrentUrl();

    expect(url).toContain('inventory');
  });

  test('@regression Locked user sees error message', async ({ loginPage }) => {
    // Builder Pattern: creates a locked user
    const user = UserBuilder.locked().build();

    await loginPage.login(user.username, user.password);
    const hasError = await loginPage.hasValidationError();
    const errorMessage = await loginPage.getErrorMessage();

    expect(hasError).toBe(true);
    expect(errorMessage).toContain('locked out');
  });

  test('@regression Random invalid user gets error', async ({ loginPage }) => {
    // Builder Pattern: creates random credentials (always invalid)
    const user = UserBuilder.random().build();

    await loginPage.login(user.username, user.password);
    const hasError = await loginPage.hasValidationError();

    expect(hasError).toBe(true);
  });

  // Data-driven test using Builder
  const userScenarios = [
    { role: 'standard' as const, shouldSucceed: true },
    { role: 'locked' as const, shouldSucceed: false },
    { role: 'problem' as const, shouldSucceed: true },
  ];

  for (const scenario of userScenarios) {
    test(`@regression ${scenario.role} user login result`, async ({ loginPage }) => {
      const user = new UserBuilder().withRole(scenario.role).build();
      await loginPage.login(user.username, user.password);
      const url = loginPage.getCurrentUrl();

      if (scenario.shouldSucceed) {
        expect(url).toContain('inventory');
      } else {
        const hasError = await loginPage.hasValidationError();
        expect(hasError).toBe(true);
      }
    });
  }
});

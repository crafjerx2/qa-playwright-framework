/**
 * @fileoverview Builder pattern implementation for test user data.
 *
 * @description
 * UserBuilder creates TestUser objects using a fluent interface.
 * It eliminates the need for repetitive object literals in tests
 * and makes test data intent explicit.
 *
 * ## Builder Pattern
 * Separates the construction of complex objects from their representation.
 * Each `with*()` method returns `this` to enable method chaining.
 *
 * ## Usage Examples
 *
 * @example
 * // Simple — using static factory methods:
 * const user = UserBuilder.standard().build();
 * const locked = UserBuilder.locked().build();
 * const random = UserBuilder.random().build();
 *
 * @example
 * // Fluent — customizing individual fields:
 * const user = new UserBuilder()
 *   .withRole('standard')
 *   .withFirstName('Carlos')
 *   .withEmail('carlos@test.com')
 *   .build();
 *
 * @example
 * // Data-driven tests:
 * const scenarios = [
 *   UserBuilder.standard().build(),
 *   UserBuilder.locked().build(),
 * ];
 * for (const user of scenarios) { ... }
 */

import { faker } from '@faker-js/faker';

/**
 * Immutable user object produced by UserBuilder.
 * All properties are readonly to prevent accidental mutation in tests.
 */
export interface TestUser {
  /** SauceDemo login username */
  readonly username: string;
  /** SauceDemo login password */
  readonly password: string;
  /** User's first name (for checkout forms) */
  readonly firstName: string;
  /** User's last name (for checkout forms) */
  readonly lastName: string;
  /** User's email address */
  readonly email: string;
  /** The user's role category */
  readonly role: UserRole;
}

/**
 * Valid SauceDemo user role types.
 * Each maps to a specific test account with different behavior.
 */
export type UserRole =
  | 'standard' // Normal user — full access
  | 'admin' // Admin user — same as standard in SauceDemo
  | 'locked' // Locked out user — cannot login
  | 'problem' // Problem user — broken images
  | 'performance'; // Performance glitch user — slow responses
// const SAUCE_USERS: Record<UserRole, { username: string; password: string }> = {
//   standard: { username: 'standard_user', password: 'secret_sauce' },
//   admin: { username: 'standard_user', password: 'secret_sauce' },
//   locked: { username: 'locked_out_user', password: 'secret_sauce' },
//   problem: { username: 'problem_user', password: 'secret_sauce' },
//   performance: { username: 'performance_glitch_user', password: 'secret_sauce' },
// };

/**
 * SauceDemo credential mapping by role.
 * All accounts share the same password.
 */
const SAUCE_CREDENTIALS: Record<UserRole, { username: string; password: string }> = {
  standard: { username: 'standard_user', password: 'secret_sauce' },
  admin: { username: 'standard_user', password: 'secret_sauce' },
  locked: { username: 'locked_out_user', password: 'secret_sauce' },
  problem: { username: 'problem_user', password: 'secret_sauce' },
  performance: { username: 'performance_glitch_user', password: 'secret_sauce' },
} as const;

export class UserBuilder {
  private username: string = SAUCE_CREDENTIALS.standard.username;
  private password: string = SAUCE_CREDENTIALS.standard.password;
  private firstName: string = faker.person.firstName();
  private lastName: string = faker.person.lastName();
  private email: string = faker.internet.email();
  private role: UserRole = 'standard';

  // ─── Fluent setters ──────────────────────────────────────────

  /**
   * Sets the username manually.
   * Note: prefer `withRole()` for SauceDemo accounts.
   * @param username - Login username
   */
  withUsername(username: string): UserBuilder {
    this.username = username;
    return this;
  }

  /**
   * Sets the password manually.
   * @param password - Login password
   */
  withPassword(password: string): UserBuilder {
    this.password = password;
    return this;
  }

  /**
   * Sets the user's first name.
   * Used for checkout form tests.
   * @param firstName - First name string
   */
  withFirstName(firstName: string): UserBuilder {
    this.firstName = firstName;
    return this;
  }

  /**
   * Sets the user's last name.
   * @param lastName - Last name string
   */
  withLastName(lastName: string): UserBuilder {
    this.lastName = lastName;
    return this;
  }

  /**
   * Sets the user's email address.
   * @param email - Valid email string
   */
  withEmail(email: string): UserBuilder {
    this.email = email;
    return this;
  }

  /**
   * Sets the user role and automatically assigns the correct credentials.
   * This is the recommended way to set credentials for SauceDemo.
   *
   * @param role - One of the valid UserRole values
   *
   * @example
   * const lockedUser = new UserBuilder().withRole('locked').build();
   */
  withRole(role: UserRole): UserBuilder {
    this.role = role;
    const credentials = SAUCE_CREDENTIALS[role];
    this.username = credentials.username;
    this.password = credentials.password;
    return this;
  }

  // ─── Semantic presets ────────────────────────────────────────

  /** Configures builder for a standard (normal) SauceDemo user */
  asStandardUser(): UserBuilder {
    return this.withRole('standard');
  }

  /** Configures builder for a locked-out SauceDemo user */
  asLockedUser(): UserBuilder {
    return this.withRole('locked');
  }

  /** Configures builder for a problem SauceDemo user */
  asProblemUser(): UserBuilder {
    return this.withRole('problem');
  }

  /** Configures builder for a performance-glitch SauceDemo user */
  asPerformanceUser(): UserBuilder {
    return this.withRole('performance');
  }

  // ─── Static factory methods ──────────────────────────────────

  /**
   * Creates a builder pre-configured for the standard user.
   * @returns UserBuilder ready to build a standard user
   */
  static standard(): UserBuilder {
    return new UserBuilder().asStandardUser();
  }

  /**
   * Creates a builder pre-configured for the locked user.
   * @returns UserBuilder ready to build a locked user
   */
  static locked(): UserBuilder {
    return new UserBuilder().asLockedUser();
  }

  /**
   * Creates a builder with completely random, invalid credentials.
   * Useful for testing rejection of unknown users.
   * @returns UserBuilder with random fake credentials
   */
  static random(): UserBuilder {
    return new UserBuilder()
      .withUsername(faker.internet.username())
      .withPassword(faker.internet.password({ length: 12 }))
      .withFirstName(faker.person.firstName())
      .withLastName(faker.person.lastName())
      .withEmail(faker.internet.email());
  }

  // ─── Build ───────────────────────────────────────────────────

  /**
   * Builds and returns an immutable TestUser object.
   * The returned object is frozen — no properties can be changed.
   *
   * @returns Frozen TestUser object
   *
   * @example
   * const user = UserBuilder.standard().build();
   * console.log(user.username); // 'standard_user'
   */
  build(): TestUser {
    return Object.freeze({
      username: this.username,
      password: this.password,
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
      role: this.role,
    });
  }
}

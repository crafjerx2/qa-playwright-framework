import { faker } from '@faker-js/faker';

export interface TestUser {
  readonly username: string;
  readonly password: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly role: UserRole;
}

export type UserRole = 'standard' | 'admin' | 'locked' | 'problem' | 'performance';

const SAUCE_USERS: Record<UserRole, { username: string; password: string }> = {
  standard: { username: 'standard_user', password: 'secret_sauce' },
  admin: { username: 'standard_user', password: 'secret_sauce' },
  locked: { username: 'locked_out_user', password: 'secret_sauce' },
  problem: { username: 'problem_user', password: 'secret_sauce' },
  performance: { username: 'performance_glitch_user', password: 'secret_sauce' },
};

export class UserBuilder {
  private username: string = SAUCE_USERS.standard.username;
  private password: string = SAUCE_USERS.standard.password;
  private firstName: string = faker.person.firstName();
  private lastName: string = faker.person.lastName();
  private email: string = faker.internet.email();
  private role: UserRole = 'standard';

  withUsername(username: string): UserBuilder {
    this.username = username;
    return this;
  }

  withPassword(password: string): UserBuilder {
    this.password = password;
    return this;
  }

  withFirstName(firstName: string): UserBuilder {
    this.firstName = firstName;
    return this;
  }

  withLastName(lastName: string): UserBuilder {
    this.lastName = lastName;
    return this;
  }

  withEmail(email: string): UserBuilder {
    this.email = email;
    return this;
  }

  withRole(role: UserRole): UserBuilder {
    this.role = role;
    const credentials = SAUCE_USERS[role];
    this.username = credentials.username;
    this.password = credentials.password;
    return this;
  }

  asStandardUser(): UserBuilder {
    return this.withRole('standard');
  }

  asLockedUser(): UserBuilder {
    return this.withRole('locked');
  }

  asPerformanceUser(): UserBuilder {
    return this.withRole('performance');
  }

  static standard(): UserBuilder {
    return new UserBuilder().asStandardUser();
  }

  static locked(): UserBuilder {
    return new UserBuilder().asLockedUser();
  }

  static random(): UserBuilder {
    return new UserBuilder()
      .withUsername(faker.internet.username())
      .withPassword(faker.internet.password())
      .withFirstName(faker.person.firstName())
      .withLastName(faker.person.lastName())
      .withEmail(faker.internet.email());
  }

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

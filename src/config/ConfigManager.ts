import { EnvironmentConfig, FrameworkConfig } from './EnvironmentConfig';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { Environment, loadEnvironment, LoadResult } from './EnvLoader';

// Load .env file once at module level
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

class ConfigManager {
  private static instance: ConfigManager | null = null;
  private readonly _config: FrameworkConfig;
  private readonly _loadResult: LoadResult;
  private readonly _initializedAt: Date;

  private constructor() {
    this._config = EnvironmentConfig.load();
    this._loadResult = loadEnvironment();
    this._initializedAt = new Date();

    // Log warnings in debug mode
    if (this._loadResult.warnings.length > 0) {
      this._loadResult.warnings.forEach((w) => {
        console.warn(`[Config] Warning: ${w}`);
      });
    }
  }

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  /**
   * Reset singleton — useful for testing the config itself
   * Only call this in test teardown
   */
  static resetInstance(): void {
    ConfigManager.instance = null;
  }

  // ─── Full config access ──────────────────────────────────────
  get settings(): FrameworkConfig {
    return this._config;
  }

  // ─── Application shortcuts ────────────────────────────────────
  get baseUrl(): string {
    return this._config.application.baseUrl;
  }

  get apiBaseUrl(): string {
    return this._config.application.apiBaseUrl;
  }

  get environment(): string {
    return this._config.application.environment;
  }

  get appName(): string {
    return this._config.application.appName;
  }

  // ─── Browser shortcuts ────────────────────────────────────────
  get browser() {
    return this._config.browser;
  }

  get browserEngine(): string {
    return this._config.browser.engine;
  }

  get isHeadless(): boolean {
    return this._config.browser.headless;
  }

  get slowMo(): number {
    return this._config.browser.slowMo;
  }

  // ─── Timeout shortcuts ────────────────────────────────────────

  get timeouts() {
    return this._config.browser.timeouts;
  }

  get actionTimeout(): number {
    return this._config.browser.timeouts.action;
  }

  get navigationTimeout(): number {
    return this._config.browser.timeouts.navigation;
  }

  // ─── Test data shortcuts ──────────────────────────────────────
  get testData() {
    return this._config.testData;
  }

  get testUsername(): string {
    return this._config.testData.credentials.username;
  }

  get testPassword(): string {
    return this._config.testData.credentials.password;
  }

  get testFirstName(): string {
    return this._config.testData.personalInfo.firstName;
  }

  get testLastName(): string {
    return this._config.testData.personalInfo.lastName;
  }

  get testPostalCode(): string {
    return this._config.testData.personalInfo.postalCode;
  }

  // ─── Reporting shortcuts ──────────────────────────────────────

  get reporting() {
    return this._config.reporting;
  }

  // ─── Retry shortcuts ──────────────────────────────────────────

  get retryCount(): number {
    return this._config.retry.count;
  }

  // ─── Worker shortcuts ─────────────────────────────────────────

  get workerCount(): number | undefined {
    return this._config.workers.count;
  }

  // ─── Environment helpers ──────────────────────────────────────
  /**
   * Checks if running in CI environment.
   */
  get isCI(): boolean {
    return !!process.env['CI'];
  }

  /**
   * Checks if running in a specific environment.
   *
   * @param env - Environment to check
   *
   * @example
   * if (Config.isEnvironment('prod')) {
   *   test.skip(); // skip destructive tests in production
   * }
   */
  isEnvironment(env: Environment): boolean {
    return this._config.application.environment === env;
  }

  /**
   * Checks if running in a non-production environment.
   */
  get isSafeEnvironment(): boolean {
    return this._config.application.environment !== 'prod';
  }

  // ─── Debug utilities ─────────────────────────────────────────

  /**
   * Prints full configuration to console.
   * Masks sensitive values like passwords.
   */
  printConfig(): void {
    const masked = { ...this._config };
    console.log('\n\n\t=== Framework Configuration ===\n');
    console.log(`Loaded files: ${this._loadResult.loadedFiles.join(', ')}`);
    console.log(`Environment: ${this.environment}`);
    console.log(`Base URL: ${this.baseUrl}`);
    console.log(`API URL: ${this.apiBaseUrl}`);
    console.log(`Browser: ${this.browserEngine}`);
    console.log(`Headless: ${this.isHeadless}`);
    console.log(`Workers: ${this.workerCount ?? 'auto'}`);
    console.log(`Retries: ${this.retryCount}`);
    console.log(`CI: ${this.isCI}`);
    console.log(`Initialized: ${this._initializedAt.toISOString()} \n`);
    void masked;
  }

  get loadResult(): LoadResult {
    return this._loadResult;
  }

  get initializedAt(): Date {
    return this._initializedAt;
  }
}

// MODULE SINGLETON — exported instance
// Node.js module cache ensures this is created only once
export const Config = ConfigManager.getInstance();

// Also export the class for advanced use cases
export { ConfigManager };

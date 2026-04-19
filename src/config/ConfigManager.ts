import { EnvironmentConfig, FrameworkConfig } from './EnvironmentConfig';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env file once at module level
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

class ConfigManager {
  private static instance: ConfigManager | null = null;
  private readonly _config: FrameworkConfig;
  private readonly _initializedAt: Date;

  private constructor() {
    this._config = EnvironmentConfig.load();
    this._initializedAt = new Date();
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

  get settings(): FrameworkConfig {
    return this._config;
  }

  get baseUrl(): string {
    return this._config.application.baseUrl;
  }

  get apiBaseUrl(): string {
    return this._config.application.apiBaseUrl;
  }

  get environment(): string {
    return this._config.application.environment;
  }

  get browserType(): string {
    return this._config.browser.type;
  }

  get isHeadless(): boolean {
    return this._config.browser.headless;
  }

  get testUsername(): string {
    return this._config.testData.username;
  }

  get testPassword(): string {
    return this._config.testData.password;
  }

  get initializedAt(): Date {
    return this._initializedAt;
  }

  /**
   * Debug info — useful for CI logs
   */
  printConfig(): void {
    console.log('=== Framework Configuration ===');
    console.log(`Environment: ${this.environment}`);
    console.log(`Base URL: ${this.baseUrl}`);
    console.log(`Browser: ${this.browserType}`);
    console.log(`Headless: ${this.isHeadless}`);
    console.log(`Initialized at: ${this._initializedAt.toISOString()}`);
    console.log('================================');
  }
}

// MODULE SINGLETON — exported instance
// Node.js module cache ensures this is created only once
export const Config = ConfigManager.getInstance();

// Also export the class for advanced use cases
export { ConfigManager };

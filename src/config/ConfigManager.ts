import { EnvironmentConfig, FrameworkConfig } from './EnvironmentConfig';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env file once at module level
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

class ConfigManager {
  private static instance: ConfigManager;
  private readonly config: FrameworkConfig;

  private constructor() {
    this.config = EnvironmentConfig.load();
  }

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  get settings(): FrameworkConfig {
    return this.config;
  }

  get baseUrl(): string {
    return this.config.application.baseUrl;
  }

  get apiBaseUrl(): string {
    return this.config.application.apiBaseUrl;
  }

  get browserType(): string {
    return this.config.browser.type;
  }

  get isHeadless(): boolean {
    return this.config.browser.headless;
  }

  get testUsername(): string {
    return this.config.testData.username;
  }

  get testPassword(): string {
    return this.config.testData.password;
  }
}

// Export singleton instance directly
// This is the TypeScript/Node.js way of doing Singleton
// Module cache ensures only one instance exists
export const Config = ConfigManager.getInstance();

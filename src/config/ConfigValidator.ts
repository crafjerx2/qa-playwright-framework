/**
 * @fileoverview Configuration validator — catches misconfig early.
 *
 * @description
 * Validates the loaded configuration at startup.
 * Fails fast with a clear message if something is wrong.
 * Better to fail at startup than to fail in the middle of a test run.
 *
 * @example
 * In globalSetup:
 * ConfigValidator.validate(Config.settings);
 */

import { Logger } from '@utils/Logger';
import { BrowserEngine, FrameworkConfig } from './EnvironmentConfig';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class ConfigValidator {
  private static readonly VALID_BROWSERS: BrowserEngine[] = ['chromium', 'firefox', 'webkit'];

  private static readonly VALID_ENVIRONMENTS = ['dev', 'qa', 'staging', 'prod', 'local'];

  /**
   * Validates the complete framework configuration.
   * Throws if critical errors are found.
   *
   * @param config - FrameworkConfig to validate
   * @throws Error if validation fails
   */
  static validate(config: FrameworkConfig): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.application.baseUrl) {
      errors.push('BASE_URL is required but not set');
    } else if (!this.isValidUrl(config.application.baseUrl)) {
      errors.push(`BASE_URL is not a valid URL: ${config.application.baseUrl}`);
    }

    if (!config.application.apiBaseUrl) {
      warnings.push('API_BASE_URL is not set — API tests may fail');
    }

    if (!this.VALID_BROWSERS.includes(config.browser.engine)) {
      errors.push(
        `Invalid BROWSER: "${config.browser.engine}". ` +
          `Valid values: ${this.VALID_BROWSERS.join(', ')}`,
      );
    }

    if (!this.VALID_ENVIRONMENTS.includes(config.application.environment)) {
      errors.push(
        `Invalid ENV: "${config.application.environment}". ` +
          `Valid values: ${this.VALID_ENVIRONMENTS.join(', ')}`,
      );
    }

    if (config.browser.timeouts.action < 1000) {
      warnings.push(
        `ACTION_TIMEOUT is very low: ${config.browser.timeouts.action}ms. ` +
          `Recommend at least 5000ms`,
      );
    }

    if (!config.testData.credentials.username) {
      errors.push('TEST_USERNAME is required but not set');
    }

    if (!config.testData.credentials.password) {
      errors.push('TEST_PASSWORD is required but not set');
    }

    if (config.application.environment === 'prod') {
      if (!config.browser.headless) {
        warnings.push('Running headed browser in production — ' + 'set HEADLESS=true for CI');
      }
      if (config.retry.count < 1) {
        warnings.push(
          'RETRY_COUNT is 0 in production — ' + 'consider at least 1 retry for flakiness',
        );
      }
    }

    if (config.workers.count !== undefined && config.workers.count < 1) {
      errors.push('WORKERS must be at least 1');
    }

    const isValid = errors.length === 0;
    if (!isValid) {
      const message = [
        '=== Configuration Validation Failed ===',
        ...errors.map((e) => `  ERROR: ${e}`),
        ...warnings.map((w) => `  WARN:  ${w}`),
        '=======================================================',
      ].join('\n');
      throw new Error(message);
    }

    // Print warnings even if valid
    if (warnings.length > 0) {
      Logger.info('\n=== Configuration Warnings ===');
      warnings.forEach((w) => Logger.info(`  WARN: ${w}`));
      Logger.info('==============================\n');
    }

    return { isValid, errors, warnings };
  }

  private static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}

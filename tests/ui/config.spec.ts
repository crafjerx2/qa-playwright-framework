/**
 * Tests that verify configuration loads correctly per environment.
 * These run first to catch config issues early.
 */

import { Config } from '@config/ConfigManager';
import { ConfigValidator } from '@config/ConfigValidator';
import { expect, test } from '@fixtures/index';
import { TestLogger } from '@utils/Logger';

test.describe('Configuration Management', () => {
  const testName1 = '@smoke Config loads without errors';
  const testName2 = '@smoke Config passes validation';

  test(testName1, () => {
    TestLogger.testStart(testName1);
    expect(Config.settings).toBeDefined();
    expect(Config.baseUrl).toBeTruthy();
    expect(Config.browserEngine).toBeTruthy();
    expect(Config.environment).toBeTruthy();
    TestLogger.testPass(testName1);
  });

  test(testName2, () => {
    TestLogger.testStart(testName2);
    const result = ConfigValidator.validate(Config.settings);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
    TestLogger.testStart(testName2);
  });

  test('@smoke Browser config is valid', () => {
    const validBrowsers = ['chromium', 'firefox', 'webkit'];
    expect(validBrowsers).toContain(Config.browserEngine);
    expect(typeof Config.isHeadless).toBe('boolean');
    expect(Config.actionTimeout).toBeGreaterThan(0);
    expect(Config.navigationTimeout).toBeGreaterThan(0);
  });

  test('@smoke Test data config is set', () => {
    expect(Config.testUsername).toBeTruthy();
    expect(Config.testPassword).toBeTruthy();
  });

  test('@smoke Environment helpers work correctly', () => {
    const validEnvs = ['dev', 'qa', 'staging', 'prod', 'local'];
    expect(validEnvs).toContain(Config.environment);

    // isEnvironment should return boolean
    expect(typeof Config.isEnvironment('qa')).toBe('boolean');
    expect(typeof Config.isSafeEnvironment).toBe('boolean');
  });

  test('@smoke Config is frozen — immutable', () => {
    // Config should be frozen — no mutation allowed
    expect(Object.isFrozen(Config.settings)).toBe(true);
    expect(Object.isFrozen(Config.settings.browser)).toBe(true);
    expect(Object.isFrozen(Config.settings.application)).toBe(true);
  });

  test('@regression Timeouts are within reasonable range', () => {
    expect(Config.actionTimeout).toBeGreaterThanOrEqual(1_000);
    expect(Config.actionTimeout).toBeLessThanOrEqual(60_000);
    expect(Config.navigationTimeout).toBeGreaterThanOrEqual(5_000);
  });
});

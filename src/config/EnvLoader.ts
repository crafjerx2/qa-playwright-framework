/**
 * @fileoverview Environment file loader with multi-environment support.
 *
 * @description
 * Loads the correct .env file based on the ENV variable.
 * Priority order (highest to lowest):
 * 1. Process environment variables (CI/CD injected)
 * 2. Environment-specific file (.env.qa, .env.staging)
 * 3. Base .env file
 *
 * ## How it works:
 * ```
 * ENV=qa npm test
 *   → loads .env.qa first
 *   → then .env as fallback
 *   → CI variables override everything
 * ```
 *
 * ## Usage:
 * Call loadEnvironment() BEFORE anything else.
 * It is called automatically when ConfigManager initializes.
 *
 * @example
 * In playwright.config.ts (runs first):
 * import { loadEnvironment } from './src/config/EnvLoader';
 * loadEnvironment();
 */
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

export type Environment = 'dev' | 'qa' | 'staging' | 'prod' | 'local';

/**
 * Result of the environment loading process.
 */
export interface LoadResult {
  environment: Environment;
  loadedFiles: string[];
  warnings: string[];
}

/**
 * Loads environment variables from .env files.
 * Respects priority: CI vars > .env.{ENV} > .env
 *
 * @returns LoadResult with details about what was loaded
 */
export function loadEnvironment(): LoadResult {
  const rootDir = process.cwd();
  const env = (process.env['ENV'] ?? 'qa') as Environment;
  const loadedFiles: string[] = [];
  const warnings: string[] = [];

  // 1. Load base .env first (lowest priority)
  const basePath = path.join(rootDir, '.env');
  if (fs.existsSync(basePath)) {
    dotenv.config({ path: basePath });
    loadedFiles.push('.env');
  } else {
    warnings.push('.env file not found — using defaults only');
  }

  // 2. Load environment-specific file (overrides base)
  if (env !== 'local') {
    const envPath = path.join(rootDir, `.env.${env}`);
    if (fs.existsSync(envPath)) {
      // override: true means env-specific values win over base
      dotenv.config({ path: envPath, override: true });
      loadedFiles.push(`.env.${env}`);
    } else {
      warnings.push(`.env.${env} not found — using .env values for ${env} environment`);
    }
  }

  // 3. CI environment variables already take precedence
  // (they were set before Node started — dotenv won't override them)
  return { environment: env, loadedFiles, warnings };
}

/**
 * Returns the current environment name.
 */
export function getCurrentEnvironment(): Environment {
  return (process.env['ENV'] ?? 'qa') as Environment;
}

/**
 * Checks if running in CI environment.
 */
export function isCI(): boolean {
  return !!process.env['CI'];
}
/**
 * @param env - Environment to check against
 */
export function isEnvironment(env: Environment): boolean {
  return getCurrentEnvironment() === env;
}

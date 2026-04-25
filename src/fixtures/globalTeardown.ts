/**
 * @fileoverview Global teardown — runs ONCE after all tests complete.
 *
 * @description
 * Cleans up resources created in global setup:
 * - Removes auth state files
 * - Logs session summary
 * - Clears browser manager registry
 */

import * as fs from 'fs';
import { AUTH_STATE_PATH } from './globalSetup';
import { BrowserManager } from './BrowserManager';

async function globalTeardown(): Promise<void> {
  //TestLogger.config('=== Global Teardown Started ===');

  // Clean up auth state file
  if (fs.existsSync(AUTH_STATE_PATH)) {
    fs.unlinkSync(AUTH_STATE_PATH);
    //TestLogger.config('Auth state file removed');
  }

  // Clear browser manager registry
  BrowserManager.clearRegistry();

  //TestLogger.config('=== Global Teardown Complete ===');
}

export default globalTeardown;

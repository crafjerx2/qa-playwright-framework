/**
 * @fileoverview Custom Playwright reporter with structured logging.
 *
 * @description
 * Implements Playwright's Reporter interface to add:
 * - Structured console output with colors
 * - Session summary with pass rate
 * - Per-test timing
 * - Failure details with error context
 *
 * ## How Playwright reporters work:
 * Playwright calls these methods at specific lifecycle points:
 * onBegin → onTestBegin → onStepBegin → onStepEnd →
 * onTestEnd → onEnd
 *
 * @see https://playwright.dev/docs/api/class-reporter
 */
import {
  Reporter,
  FullConfig,
  Suite,
  TestCase,
  TestResult,
  FullResult,
  TestError,
} from '@playwright/test/reporter';
import { TestLogger } from '@utils/Logger';

// ANSI color codes for console output
const Colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
} as const;

const c = (color: keyof typeof Colors, text: string): string =>
  `${Colors[color]}${text}${Colors.reset}`;

export default class CustomReporter implements Reporter {
  private startTime: number = 0;
  private passCount: number = 0;
  private failCount: number = 0;
  private skipCount: number = 0;
  private failedTests: Array<{ name: string; error: string }> = [];

  // ─── Session events ──────────────────────────────────────────

  onBegin(config: FullConfig, suite: Suite): void {
    this.startTime = Date.now();
    const totalTests = suite.allTests().length;

    const environment = process.env['ENV'] ?? 'qa';
    const browserName = process.env['BROWSER'] ?? 'chromium';

    console.log('\n' + c('bold', '╔════════════════════════════════════╗'));
    console.log(c('bold', '║   QA Playwright Framework - Tests  ║'));
    console.log(c('bold', '╚════════════════════════════════════╝'));
    console.log(c('dim', `Environment: ${environment}`));
    console.log(c('dim', `Browser:     ${browserName}`));
    console.log(c('dim', `Workers:     ${config.workers}`));
    console.log(c('dim', `Total tests: ${totalTests}`));
    console.log(c('dim', `Started:     ${new Date().toLocaleTimeString()}`));
    console.log('');

    TestLogger.sessionStart(environment, browserName);
  }

  onEnd(result: FullResult): void {
    const duration = ((Date.now() - this.startTime) / 1000).toFixed(1);
    const total = this.passCount + this.failCount + this.skipCount;
    const passRate = total > 0 ? Math.round((this.passCount / total) * 100) : 0;

    console.log('\n' + c('bold', '─'.repeat(40)));
    console.log(c('bold', 'TEST SESSION SUMMARY'));
    console.log(c('bold', '─'.repeat(40)));
    console.log(`${c('green', 'Passed')}:  ${this.passCount}`);
    console.log(`${c('red', 'Failed')}:  ${this.failCount}`);
    console.log(`${c('yellow', 'Skipped')}: ${this.skipCount}`);
    console.log(`\nTotal:    ${total}`);
    console.log(
      `Pass rate: ${passRate >= 80 ? c('green', `${passRate}%`) : c('red', `${passRate}%`)}`,
    );
    console.log(`Duration: ${duration}s`);
    console.log(
      `Status: ${result.status === 'passed' ? c('green', 'ALL PASSED') : c('red', 'SOME FAILED')}`,
    );

    // Print failed tests summary
    if (this.failedTests.length > 0) {
      console.log('\n' + c('red', c('bold', 'FAILED TESTS:')));
      this.failedTests.forEach((test, i) => {
        console.log(c('red', `  ${i + 1}. ${test.name}`));
        console.log(c('dim', `     ${test.error.split('\n')[0] ?? ''}`));
      });
    }

    console.log('');

    TestLogger.sessionEnd(this.passCount, this.failCount, this.skipCount);
  }

  // ─── Test events ─────────────────────────────────────────────

  onTestBegin(test: TestCase): void {
    TestLogger.testStart(test.title);
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    const duration = result.duration;
    const durationStr = duration < 1000 ? `${duration}ms` : `${(duration / 1000).toFixed(1)}s`;

    switch (result.status) {
      case 'passed':
        this.passCount++;
        console.log(`${c('green', '')} ${test.title} ${c('dim', `(${durationStr})`)}`);
        TestLogger.testPass(test.title, duration);
        break;

      case 'failed':
      case 'timedOut':
        this.failCount++;
        const error = result.error?.message ?? 'Unknown error';
        console.log(`${c('red', '')} ${test.title} ${c('dim', `(${durationStr})`)}`);
        console.log(c('red', `   Error: ${error.split('\n')[0] ?? ''}`));
        this.failedTests.push({ name: test.title, error });
        TestLogger.testFail(test.title, error);
        break;

      case 'skipped':
        this.skipCount++;
        console.log(`${c('yellow', '')} ${c('dim', test.title)} (skipped)`);
        TestLogger.testSkip(test.title);
        break;

      case 'interrupted':
        console.log(`${c('yellow', '')} ${test.title} (interrupted)`);
        break;
    }

    // Log retries
    if (result.retry > 0) {
      console.log(c('yellow', `   Retry ${result.retry}`));
    }
  }

  // ─── Errors ──────────────────────────────────────────────────
  onError(error: TestError): void {
    const errorMessage = error.message || error.value || 'Unknown error';
    console.error(c('red', `\n Framework Error: ${errorMessage}`));
    TestLogger.error('Framework error', error as Error);
  }
}

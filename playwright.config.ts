import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for E2E Testing
 *
 * Includes configuration for:
 * - Basic UI tests (home.spec.ts)
 * - Channel lifecycle tests (steps/*.spec.ts)
 *
 * Timeouts are extended for proof generation steps (up to 10 minutes)
 */
export default defineConfig({
  testDir: './e2e',

  // Run tests sequentially in CI for lifecycle tests
  fullyParallel: false,

  // Fail the build on CI if you accidentally left test.only
  forbidOnly: !!process.env.CI,

  // Retry failed tests
  retries: process.env.CI ? 2 : 0,

  // Use single worker for sequential lifecycle tests
  workers: 1,

  // Reporter configuration
  reporter: process.env.CI
    ? [
        ['html', { outputFolder: 'playwright-report' }],
        ['list'],
        ['github'],
      ]
    : [
        ['html', { outputFolder: 'playwright-report' }],
        ['list'],
      ],

  // Global timeout for each test (15 minutes for proof generation)
  timeout: 15 * 60 * 1000,

  // Expect timeout
  expect: {
    timeout: 30_000,
  },

  // Shared settings for all projects
  use: {
    // Base URL for the app
    baseURL: process.env.BASE_URL || 'http://localhost:3000',

    // Collect trace on first retry
    trace: 'on-first-retry',

    // Take screenshot on failure
    screenshot: 'only-on-failure',

    // Video recording on failure
    video: 'on-first-retry',

    // Extended action timeout for slow operations
    actionTimeout: 30_000,

    // Extended navigation timeout
    navigationTimeout: 60_000,
  },

  // Test projects
  projects: [
    // Basic UI tests
    {
      name: 'ui',
      testMatch: /home\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
      },
    },

    // Channel lifecycle tests (run sequentially)
    {
      name: 'lifecycle',
      testMatch: /steps\/.*\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        // Longer timeouts for lifecycle tests
        actionTimeout: 60_000,
        navigationTimeout: 120_000,
      },
      // Dependencies ensure sequential execution
      dependencies: [],
    },
  ],

  // Output directory for test artifacts
  outputDir: 'test-results/',

  // Web server configuration (local development only)
  webServer: process.env.CI
    ? undefined
    : {
        command: 'npm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000,
        env: {
          RPC_URL: process.env.ANVIL_URL || process.env.RPC_URL || '',
        },
      },
});

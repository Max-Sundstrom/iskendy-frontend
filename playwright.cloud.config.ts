import { defineConfig, devices } from '@playwright/test';
import { resolve } from 'node:path';

process.env.PLAYWRIGHT_BROWSERS_PATH ??= resolve('.cache/ms-playwright');
const remote = process.env.ISKENDY_DEMO_URL;
const local = 'http://127.0.0.1:4191/iskendy-frontend/';
export default defineConfig({
  testDir: './tests/cloud-demo',
  fullyParallel: true,
  forbidOnly: true,
  retries: 0,
  workers: 2,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report-cloud', open: 'never' }],
  ],
  outputDir: 'test-results-cloud',
  use: {
    baseURL: remote ?? local,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    reducedMotion: 'reduce',
  },
  projects: [
    { name: 'iphone', use: devices['iPhone 13'] },
    { name: 'android', use: devices['Pixel 5'] },
    {
      name: 'tablet',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 834, height: 1194 },
      },
    },
    {
      name: 'desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 1000 },
      },
    },
  ],
  webServer: remote
    ? undefined
    : {
        command:
          'node scripts/build-cloud-demo.mjs && node scripts/serve-cloud-demo.mjs',
        url: local,
        reuseExistingServer: false,
        timeout: 60_000,
      },
});

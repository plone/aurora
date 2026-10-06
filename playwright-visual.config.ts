import { defineConfig, devices } from '@playwright/test';

// Visual regression tests. Baseline screenshots live in an external repository
// (plone/aurora-visual-regression), checked out into `playwright/__screenshots__`
// by CI. They are only ever generated in CI (see the "Update VRT Screenshots"
// workflow), so local runs tolerate small rendering differences.
const isCI = !!process.env.CI || !!process.env.GITHUB_ACTIONS;

export default defineConfig({
  testDir: '.',
  testMatch: [
    'packages/*/acceptance/visual/**/*.{spec,test}.{ts,tsx}',
    'apps/*/acceptance/visual/**/*.{spec,test}.{ts,tsx}',
  ],
  testIgnore: ['**/.codex/**', '**/node_modules/**'],
  outputDir: 'playwright/results-visual',
  // Tests share one backend that is reset around every test.
  workers: 1,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  timeout: 30_000,
  expect: {
    timeout: 10_000,
    toHaveScreenshot: {
      animations: 'disabled',
      caret: 'hide',
      // Never commit screenshots made outside CI; locally, allow for font
      // rendering differences between platforms.
      ...(isCI ? {} : { maxDiffPixelRatio: 0.05 }),
    },
  },
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:3000',
    browserName: 'chromium',
    viewport: { width: 1280, height: 720 },
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  snapshotPathTemplate:
    'playwright/__screenshots__/{testFilePath}/{arg}{-projectName}{ext}',
});

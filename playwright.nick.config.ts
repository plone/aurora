import { defineConfig } from '@playwright/test';
import sharedConfig from './playwright.config';

process.env.ACCEPTANCE_BACKEND = 'nick';

export default defineConfig({
  ...sharedConfig,
  outputDir: 'playwright/results-nick',
  retries: 0,
});

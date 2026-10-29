import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test, type Page } from '@playwright/test';

// The Quanta components, screenshotted from their Storybook stories. They're
// the safety net for aligning Quanta with React Aria's Tailwind starter
// (plone/aurora#275): the APIs change, the look must not.
//
// The tests run against the static Storybook build, served by the visual
// config's web server. Build it first:
//
//   pnpm --filter @plone/quanta build-storybook
//
// They don't use the backend, so they don't reset it.

const STORYBOOK_URL = process.env.STORYBOOK_URL ?? 'http://localhost:6007';

const storybookIndex = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../storybook-static/index.json',
);

type StoryEntry = { id: string; title: string; name: string; type: string };

function loadStories(): StoryEntry[] {
  if (!fs.existsSync(storybookIndex)) {
    if (process.env.CI) {
      throw new Error(
        `Quanta's Storybook isn't built (${storybookIndex} is missing).`,
      );
    }
    return [];
  }
  const index = JSON.parse(fs.readFileSync(storybookIndex, 'utf-8')) as {
    entries: Record<string, StoryEntry>;
  };
  return Object.values(index.entries).filter((entry) => entry.type === 'story');
}

// Stories whose output changes on every run.
const UNSTABLE_STORIES = new Set([
  // Fills in the current time when focused, with the seconds.
  'quanta-datetimepicker--auto-current-time',
]);

const stories = loadStories().filter(
  (story) => !UNSTABLE_STORIES.has(story.id),
);

test.use({
  baseURL: STORYBOOK_URL,
  locale: 'en-US',
  timezoneId: 'Europe/Madrid',
});

test.beforeEach(async ({ page }) => {
  // Stories that default to "today" or "now" render the same date every run.
  await page.clock.setFixedTime(new Date('2026-01-15T10:30:00Z'));
});

async function openStory(page: Page, id: string) {
  await page.goto(`/iframe.html?id=${id}&viewMode=story`);
  // Storybook sets one of these classes once the story has rendered, or failed.
  await page
    .locator('body.sb-show-main, body.sb-show-errordisplay')
    .waitFor({ state: 'attached' });
  const error = page.locator('body.sb-show-errordisplay #error-message');
  if (await error.count()) {
    throw new Error(`The story failed to render: ${await error.textContent()}`);
  }
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  // Park the mouse away from the story, so nothing shows a hover state.
  await page.mouse.move(0, 0);
}

test.describe('Quanta stories', () => {
  test.skip(
    stories.length === 0,
    'Build the Storybook first: pnpm --filter @plone/quanta build-storybook',
  );

  for (const story of stories) {
    test(`${story.title} / ${story.name}`, async ({ page }) => {
      await openStory(page, story.id);
      await expect(page.locator('#storybook-root')).toHaveScreenshot(
        `${story.id}.png`,
      );
    });
  }
});

// Hover, focus and open states, which a story doesn't show by itself.
// Overlays render outside the story root, so these take the whole page.
test.describe('Quanta states', () => {
  test.skip(
    stories.length === 0,
    'Build the Storybook first: pnpm --filter @plone/quanta build-storybook',
  );

  test('Button hover and focus', async ({ page }) => {
    for (const id of [
      'quanta-button--neutral',
      'quanta-button--accent',
      'quanta-button--accent-primary',
      'quanta-button--destructive',
    ]) {
      await openStory(page, id);
      const button = page
        .locator('#storybook-root')
        .getByRole('button')
        .first();
      await button.hover();
      await expect(page.locator('#storybook-root')).toHaveScreenshot(
        `${id}--hover.png`,
      );
      await page.mouse.move(0, 0);
      await page.keyboard.press('Tab');
      await expect(button).toBeFocused();
      await expect(page.locator('#storybook-root')).toHaveScreenshot(
        `${id}--focus.png`,
      );
    }
  });

  test('Link hover and focus', async ({ page }) => {
    await openStory(page, 'quanta-link--default');
    const link = page.getByRole('link');
    await link.hover();
    await expect(page.locator('#storybook-root')).toHaveScreenshot(
      'quanta-link--default--hover.png',
    );
    await page.mouse.move(0, 0);
    await page.keyboard.press('Tab');
    await expect(link).toBeFocused();
    await expect(page.locator('#storybook-root')).toHaveScreenshot(
      'quanta-link--default--focus.png',
    );
  });

  test('TextField focus', async ({ page }) => {
    await openStory(page, 'quanta-textfield--default');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('textbox')).toBeFocused();
    await expect(page.locator('#storybook-root')).toHaveScreenshot(
      'quanta-textfield--default--focus.png',
    );
  });

  test('Checkbox focus and toggle', async ({ page }) => {
    await openStory(page, 'quanta-checkbox--default');
    await page.keyboard.press('Tab');
    await expect(page.locator('#storybook-root')).toHaveScreenshot(
      'quanta-checkbox--default--focus.png',
    );
    await page.keyboard.press('Space');
    await expect(page.getByRole('checkbox')).toBeChecked();
    await expect(page.locator('#storybook-root')).toHaveScreenshot(
      'quanta-checkbox--default--focus-selected.png',
    );
  });

  test('RadioGroup focus', async ({ page }) => {
    await openStory(page, 'quanta-radiogroup--selected');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('radio', { name: 'Baseball' })).toBeFocused();
    await expect(page.locator('#storybook-root')).toHaveScreenshot(
      'quanta-radiogroup--selected--focus.png',
    );
  });

  test('Select open', async ({ page }) => {
    for (const id of ['quanta-select--default', 'quanta-select--sections']) {
      await openStory(page, id);
      await page.getByRole('button').first().click();
      await expect(page.getByRole('listbox')).toBeVisible();
      await page.mouse.move(0, 0);
      await expect(page).toHaveScreenshot(`${id}--open.png`);
    }
  });

  test('ComboBox open', async ({ page }) => {
    await openStory(page, 'quanta-combobox--default');
    await page.getByRole('button').first().click();
    await expect(page.getByRole('listbox')).toBeVisible();
    await page.mouse.move(0, 0);
    await expect(page).toHaveScreenshot('quanta-combobox--default--open.png');
  });

  test('MultiSelect open', async ({ page }) => {
    await openStory(page, 'quanta-multiselect--default');
    await page.getByRole('combobox').first().focus();
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('listbox')).toBeVisible();
    await page.mouse.move(0, 0);
    await expect(page).toHaveScreenshot(
      'quanta-multiselect--default--open.png',
    );
  });

  test('Menu open', async ({ page }) => {
    for (const id of [
      'quanta-menu--default',
      'quanta-menu--with-sections',
      'quanta-menu--single-selection',
    ]) {
      await openStory(page, id);
      await page.getByRole('button').first().click();
      await expect(page.getByRole('menu')).toBeVisible();
      await page.mouse.move(0, 0);
      await expect(page).toHaveScreenshot(`${id}--open.png`);
    }
  });

  test('Menu submenu open', async ({ page }) => {
    await openStory(page, 'quanta-menu--with-submenu');
    await page.getByRole('button').first().click();
    await page.locator('[role="menuitem"][aria-haspopup]').first().click();
    await expect(page.getByRole('menu')).toHaveCount(2);
    await page.mouse.move(0, 0);
    await expect(page).toHaveScreenshot('quanta-menu--with-submenu--open.png');
  });

  test('Toolbar menu open', async ({ page }) => {
    await openStory(page, 'quanta-toolbar--with-menus');
    await page.locator('[aria-haspopup]').first().click();
    await expect(page.getByRole('menu')).toBeVisible();
    await page.mouse.move(0, 0);
    await expect(page).toHaveScreenshot('quanta-toolbar--with-menus--open.png');
  });

  test('Popover open', async ({ page }) => {
    await openStory(page, 'quanta-popover--example');
    await page.getByRole('button').first().click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.mouse.move(0, 0);
    await expect(page).toHaveScreenshot('quanta-popover--example--open.png');
  });

  test('Dialog open', async ({ page }) => {
    for (const id of ['quanta-dialog--default', 'quanta-dialog--in-popover']) {
      await openStory(page, id);
      await page.getByRole('button').first().click();
      await expect(
        page.getByRole('dialog').or(page.getByRole('alertdialog')),
      ).toBeVisible();
      await page.mouse.move(0, 0);
      await expect(page).toHaveScreenshot(`${id}--open.png`);
    }
  });

  test('Modal open', async ({ page }) => {
    await openStory(page, 'quanta-modal--default');
    await page.getByRole('button').first().click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.mouse.move(0, 0);
    await expect(page).toHaveScreenshot('quanta-modal--default--open.png');
  });

  test('Sheet open', async ({ page }) => {
    for (const id of [
      'quanta-sheet--default',
      'quanta-sheet--left',
      'quanta-sheet--bottom',
    ]) {
      await openStory(page, id);
      await page.getByRole('button').first().click();
      await expect(page.getByRole('dialog')).toBeVisible();
      // Wait for the sheet to finish sliding in.
      await page.waitForTimeout(500);
      await page.mouse.move(0, 0);
      await expect(page).toHaveScreenshot(`${id}--open.png`);
    }
  });

  test('Tooltip open', async ({ page }) => {
    await openStory(page, 'quanta-tooltip--default');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('tooltip')).toBeVisible();
    await expect(page).toHaveScreenshot('quanta-tooltip--default--open.png');
  });

  test('DatePicker open', async ({ page }) => {
    for (const id of [
      'quanta-datepicker--default',
      'quanta-datepicker--with-default-value',
      'quanta-datetimepicker--default',
    ]) {
      await openStory(page, id);
      await page.locator('button[aria-haspopup]').first().click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await page.mouse.move(0, 0);
      await expect(page).toHaveScreenshot(`${id}--open.png`);
    }
  });

  test('Accordion expanded', async ({ page }) => {
    await openStory(page, 'quanta-accordion--default');
    const trigger = page.getByRole('button', {
      name: 'How do I reset my password?',
    });
    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await page.mouse.move(0, 0);
    await expect(page.locator('#storybook-root')).toHaveScreenshot(
      'quanta-accordion--default--expanded.png',
    );
  });

  test('Tabs second tab', async ({ page }) => {
    await openStory(page, 'quanta-tabs--default');
    const tab = page.getByRole('tab').nth(1);
    await tab.click();
    await expect(tab).toHaveAttribute('aria-selected', 'true');
    await page.mouse.move(0, 0);
    await expect(page.locator('#storybook-root')).toHaveScreenshot(
      'quanta-tabs--default--second-tab.png',
    );
  });

  test('Table row selected', async ({ page }) => {
    await openStory(page, 'quanta-table--selectable');
    await page.getByRole('row').nth(1).getByRole('checkbox').check();
    await page.mouse.move(0, 0);
    await expect(page.locator('#storybook-root')).toHaveScreenshot(
      'quanta-table--selectable--selected.png',
    );
  });

  test('GridList item selected', async ({ page }) => {
    await openStory(page, 'quanta-gridlist--multiple-selection');
    const row = page.getByRole('row').first();
    await row.click();
    await expect(row).toHaveAttribute('aria-selected', 'true');
    await page.mouse.move(0, 0);
    await expect(page.locator('#storybook-root')).toHaveScreenshot(
      'quanta-gridlist--multiple-selection--selected.png',
    );
  });
});

import { expect, test } from '../../../tooling/playwright/test';
import { createPlateShowcase } from '../../../tooling/playwright/content';

// Seeds the reusable fixture at
// `tooling/playwright/fixtures/plate-showcase.json`, which contains one use
// case of every native Plate block/node available in Aurora. The same fixture
// backs `tooling/scripts/create_showcase.py` (manual showcase), so this test
// and the manual page never drift apart.
const PAGE_ID = 'plate-showcase';

test.describe('Plate native blocks showcase', () => {
  test.beforeEach(async ({ page }) => {
    await createPlateShowcase(page, {
      contentId: PAGE_ID,
      contentTitle: 'Plate Native Blocks — Showcase',
      transition: 'publish',
    });
  });

  test('renders every native Plate block in view mode', async ({ page }) => {
    const response = await page.goto(`/${PAGE_ID}`);
    expect(response?.ok()).toBeTruthy();

    // Title block -> h1
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: 'Plate Native Blocks — Showcase',
      }),
    ).toBeVisible();

    // Headings h1..h6
    await expect(
      page.getByRole('heading', { level: 1, name: 'Heading level 1' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { level: 2, name: 'Heading level 2' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { level: 3, name: 'Heading level 3' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { level: 4, name: 'Heading level 4' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { level: 5, name: 'Heading level 5' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { level: 6, name: 'Heading level 6' }),
    ).toBeVisible();

    // Paragraph
    await expect(
      page.getByText('A plain paragraph of body text', { exact: false }),
    ).toBeVisible();

    // Text marks
    await expect(page.locator('strong', { hasText: 'bold' })).toBeVisible();
    await expect(page.locator('em', { hasText: 'italic' })).toBeVisible();
    await expect(page.locator('u', { hasText: 'underline' })).toBeVisible();
    await expect(page.locator('s', { hasText: 'strikethrough' })).toBeVisible();
    await expect(page.locator('mark', { hasText: 'highlight' })).toBeVisible();
    await expect(page.locator('kbd', { hasText: 'Ctrl' })).toBeVisible();
    await expect(page.locator('sub', { hasText: 'script' })).toBeVisible();
    await expect(page.locator('sup', { hasText: 'script' })).toBeVisible();
    // inline code mark
    await expect(
      page.locator('code', { hasText: 'inline code' }),
    ).toBeVisible();

    // Font styles (color / background / size / family) — assert the styled runs exist
    await expect(page.getByText('Coloured text')).toBeVisible();
    await expect(page.getByText('bigger text')).toBeVisible();

    // Link + mention
    await expect(
      page.getByRole('link', { name: 'Plone community website' }),
    ).toHaveAttribute('href', 'https://plone.org');
    await expect(page.getByText('Alice')).toBeVisible();

    // Blockquote
    await expect(
      page.locator('blockquote', {
        hasText: 'The best way to predict the future is to invent it.',
      }),
    ).toBeVisible();

    // Bulleted list (+ nested)
    await expect(page.getByText('First bullet')).toBeVisible();
    await expect(page.getByText('Nested bullet')).toBeVisible();

    // Numbered list
    await expect(page.getByText('Step one')).toBeVisible();
    await expect(page.getByText('Step three')).toBeVisible();

    // To-do list
    await expect(page.getByText('Write the showcase')).toBeVisible();
    await expect(page.getByText('Review it in the browser')).toBeVisible();

    // Code block
    await expect(
      page.locator('pre', {
        hasText: "const rhythm = 'one file, styled by tag';",
      }),
    ).toBeVisible();

    // Horizontal rule
    await expect(page.locator('hr').first()).toBeVisible();

    // Callout
    await expect(
      page.getByText('Callouts draw attention to a helpful tip or warning.'),
    ).toBeVisible();

    // Toggle
    await expect(page.getByText('Click to expand this toggle')).toBeVisible();

    // Columns
    await expect(page.getByText('Left column content.')).toBeVisible();
    await expect(page.getByText('Right column content.')).toBeVisible();

    // Table
    await expect(page.locator('table')).toBeVisible();
    await expect(
      page.getByRole('cell', { name: 'Section title' }),
    ).toBeVisible();

    // Table of contents
    await expect(
      page.getByRole('heading', { name: 'Table of contents' }),
    ).toBeVisible();

    // Media — video / audio / file
    await expect(page.locator('video')).toBeVisible();
    await expect(page.locator('audio')).toBeVisible();
    await expect(page.getByText('dummy.pdf')).toBeVisible();

    // Renderer must not leak the "used outside Plate" runtime error
    await expect(
      page.getByText('Plate hooks must be used inside a Plate or PlateController'),
    ).toHaveCount(0);
  });

  test('renders with JavaScript disabled (SSR)', async ({ page, browser }) => {
    const noJsContext = await browser.newContext({ javaScriptEnabled: false });
    const noJsPage = await noJsContext.newPage();

    try {
      const response = await noJsPage.goto(`/${PAGE_ID}`);
      expect(response?.ok()).toBeTruthy();

      await expect(
        noJsPage.getByRole('heading', {
          level: 1,
          name: 'Plate Native Blocks — Showcase',
        }),
      ).toBeVisible();
      await expect(
        noJsPage.locator('blockquote', {
          hasText: 'The best way to predict the future is to invent it.',
        }),
      ).toBeVisible();
      await expect(
        noJsPage.locator('pre', {
          hasText: "const rhythm = 'one file, styled by tag';",
        }),
      ).toBeVisible();
      await expect(noJsPage.getByText('Left column content.')).toBeVisible();
    } finally {
      await noJsContext.close();
    }
  });
});

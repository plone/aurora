import {
  expect,
  type JSHandle,
  type Locator,
  type Page,
} from '@playwright/test';
import { getSelection } from '@platejs/playwright';

declare global {
  interface Window {
    platePlaywrightAdapter?: {
      EDITABLE_TO_EDITOR?: WeakMap<HTMLElement, unknown>;
    };
  }
}

export type WaitForPlateEditorReadyOptions = {
  timeout?: number;
};

type PlatePoint = {
  /** Slate path of the text node or caret target. */
  path: number[];
  /** Character offset inside the Slate text node. */
  offset: number;
};

type PlateSelection = {
  /** Start point of the selected range. */
  anchor: PlatePoint;
  /** End point of the selected range. */
  focus: PlatePoint;
};

/**
 * Wait until:
 * - the Slate editable is visible
 * - `window.platePlaywrightAdapter` exists
 * - the adapter WeakMap has the editable -> editor mapping
 *
 * This avoids races with lazy-loaded editors and `useEffect` timing.
 */
export async function waitForPlateEditorReady(
  page: Page,
  editable: Locator = page.locator('[data-slate-editor]'),
  { timeout = 10_000 }: WaitForPlateEditorReadyOptions = {},
) {
  await editable.waitFor({ state: 'visible', timeout });

  await page.waitForFunction(
    () => {
      const el = document.querySelector('[data-slate-editor]');
      const adapter = window.platePlaywrightAdapter;
      return !!el && !!adapter?.EDITABLE_TO_EDITOR?.has(el as HTMLElement);
    },
    { timeout },
  );

  return editable;
}

/**
 * Select text in a Plate editor and mirror that selection into the browser DOM.
 *
 * `@platejs/playwright`'s `setSelection` updates Plate's internal Slate
 * selection, but the browser may still have no visible `window.getSelection()`
 * range. Floating toolbars and link popovers depend on the DOM selection, so
 * tests that need selected text to behave like a real user selection should use
 * this helper instead.
 *
 * The helper verifies both states before returning:
 * - Plate's internal selection matches `selection`.
 * - `window.getSelection().toString()` matches `selectedText`.
 */
export async function selectPlateEditorText(
  page: Page,
  editorHandle: JSHandle,
  selection: PlateSelection,
  selectedText: string,
) {
  await page.evaluate(
    ([editor, selection]) => {
      const range = editor.api.range(selection);
      const domRange = editor.api.toDOMRange(range);
      const domSelection = window.getSelection();

      if (!domRange || !domSelection) {
        throw new Error('Could not resolve DOM selection for Plate range.');
      }

      editor.tf.focus();
      editor.tf.setSelection(range);
      domSelection.removeAllRanges();
      domSelection.addRange(domRange);
    },
    [editorHandle, selection],
  );

  await expect
    .poll(async () => {
      const currentSelection = await getSelection(page, editorHandle);

      return JSON.stringify({
        anchor: currentSelection?.anchor,
        focus: currentSelection?.focus,
      });
    })
    .toBe(JSON.stringify(selection));

  await expect
    .poll(() => page.evaluate(() => window.getSelection()?.toString() ?? ''))
    .toBe(selectedText);
}

/**
 * Move the caret to a single Plate editor point and focus the editor.
 *
 * Use this for collapsed selections, such as placing the caret before typing or
 * pressing Enter. For non-collapsed text selections that should visibly select
 * text in the browser, use `selectPlateEditorText`.
 */
export async function selectPlateEditorPoint(
  page: Page,
  editorHandle: JSHandle,
  point: PlatePoint,
) {
  await page.evaluate(
    ([editor, point]) => {
      editor.tf.focus();
      editor.tf.select(point);
    },
    [editorHandle, point],
  );
}

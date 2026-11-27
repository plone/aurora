const FOCUSABLE = 'a[href], button, input, select, textarea, [tabindex]';

/**
 * The controls inside an element that Tab reaches, in order: enabled, not
 * editable text, not removed with `tabindex="-1"`, and not hidden.
 */
export const getFocusableControls = (root: HTMLElement) =>
  Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (element) =>
      !element.isContentEditable &&
      element.tabIndex >= 0 &&
      !(element as HTMLButtonElement).disabled &&
      !element.closest('[hidden]') &&
      (typeof element.checkVisibility === 'function'
        ? element.checkVisibility({ visibilityProperty: true })
        : getComputedStyle(element).visibility !== 'hidden'),
  );

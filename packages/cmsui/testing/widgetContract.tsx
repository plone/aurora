import { act, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ComponentType, ReactNode } from 'react';
import type { FormWidgetProps } from '@plone/types';

/** The checks of `describeWidgetContract`. */
export type WidgetContractCheck =
  | 'label'
  | 'description'
  | 'required'
  | 'invalid'
  | 'valid'
  | 'empty'
  | 'widgetOptions'
  | 'change';

export type WidgetContractOptions<T> = {
  /** A valid value of the field, as the content API stores it. */
  value: T;
  /**
   * Changes the value in the rendered widget, like an editor would, and the
   * value the widget must then report with `onChange`.
   */
  change?: {
    perform: (container: HTMLElement) => unknown;
    expected: T;
  };
  /** Other props the widget needs, such as its widget options. */
  props?: Partial<FormWidgetProps<T>> & Record<string, unknown>;
  /** Wraps the widget, for example in a router or other providers. */
  wrapper?: ComponentType<{ children: ReactNode }>;
  /**
   * Checks the widget does not pass yet, each with the reason. They are
   * reported as skipped, so the gap stays visible.
   */
  skip?: Partial<Record<WidgetContractCheck, string>>;
};

const LABEL = 'Contract field';
const DESCRIPTION = 'Contract field description';
const ERROR = 'Contract field error';

/**
 * Tests that a widget follows the widget contract (`FormWidgetProps`): it
 * renders its label and description, marks a required field, shows its
 * validation error only when invalid, renders without a value, ignores the
 * widget options it does not know, and reports changes with
 * `onChange(value)`.
 *
 * Use it for every widget you register:
 *
 * ```ts
 * import { describeWidgetContract } from '@plone/cmsui/testing/widgetContract';
 *
 * describeWidgetContract('PhoneWidget', PhoneWidget, {
 *   value: '+49 89 1234567',
 *   change: {
 *     perform: () => userEvent.type(screen.getByRole('textbox'), '8'),
 *     expected: '+49 89 12345678',
 *   },
 * });
 * ```
 */
export function describeWidgetContract<T>(
  name: string,
  Widget: ComponentType<FormWidgetProps<T>>,
  // The value type comes from the widget, not from the example value.
  options: WidgetContractOptions<NoInfer<T>>,
) {
  const renderWidget = (props: Record<string, unknown> = {}) =>
    render(
      <Widget
        name="contract_field"
        label={LABEL}
        value={options.value}
        onChange={vi.fn()}
        {...(options.props as Partial<FormWidgetProps<T>>)}
        {...(props as Partial<FormWidgetProps<T>>)}
      />,
      { wrapper: options.wrapper },
    );

  const check = (
    id: WidgetContractCheck,
    title: string,
    test: () => void | Promise<void>,
  ) => {
    const reason = options.skip?.[id];
    if (reason) it.skip(`${title} (skipped: ${reason})`, test);
    else it(title, test);
  };

  describe(`${name} follows the widget contract`, () => {
    check('label', 'renders its label', () => {
      renderWidget();
      expect(screen.getAllByText(LABEL).length).toBeGreaterThan(0);
    });

    check('description', 'renders its description', () => {
      renderWidget({ description: DESCRIPTION });
      expect(screen.getByText(DESCRIPTION)).toBeTruthy();
    });

    check('required', 'marks a required field', () => {
      const { container } = renderWidget({ required: true });
      expect(
        container.querySelector('[required], [aria-required="true"]'),
      ).not.toBeNull();
    });

    check('invalid', 'shows its validation error when invalid', () => {
      const { container } = renderWidget({
        invalid: true,
        errorMessage: ERROR,
      });
      expect(screen.getByText(ERROR)).toBeTruthy();
      expect(
        container.querySelector('[aria-invalid="true"], [data-invalid]'),
      ).not.toBeNull();
    });

    check('valid', 'does not show an error message when valid', () => {
      renderWidget({ invalid: false, errorMessage: ERROR });
      expect(screen.queryByText(ERROR)).toBeNull();
    });

    check('empty', 'renders without a value', () => {
      renderWidget({ value: null });
      renderWidget({ value: undefined });
      expect(screen.getAllByText(LABEL).length).toBeGreaterThan(0);
    });

    check('widgetOptions', 'ignores widget options it does not know', () => {
      renderWidget({
        unknownWidgetOption: 'ignored',
        schema: { title: LABEL, unknownWidgetOption: 'ignored' },
      });
      expect(screen.getAllByText(LABEL).length).toBeGreaterThan(0);
    });

    if (options.change) {
      const { perform, expected } = options.change;
      check('change', 'reports a change with onChange(value)', async () => {
        const onChange = vi.fn();
        const { container } = renderWidget({ onChange });
        await act(async () => {
          await perform(container);
        });
        expect(onChange).toHaveBeenLastCalledWith(expected);
      });
    }
  });
}

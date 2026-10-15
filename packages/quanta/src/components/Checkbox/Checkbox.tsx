import React from 'react';
import { CheckboxIcon, DashIcon } from '@plone/icons';
import {
  CheckboxButton,
  CheckboxField,
  type CheckboxFieldProps,
  type ValidationResult,
  composeRenderProps,
} from 'react-aria-components';
import { tv } from 'tailwind-variants';
import { Description, FieldError } from '../Field/Field';
import { focusRing } from '../../utils';

const checkboxStyles = tv({
  base: 'group flex items-center gap-2 text-sm transition',
  variants: {
    isDisabled: {
      false: 'text-quanta-cobalt',
      true: `
        text-quanta-iron
        forced-colors:text-[GrayText]
      `,
    },
  },
});

const boxStyles = tv({
  extend: focusRing,
  base: 'flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 transition',
  variants: {
    isSelected: {
      false: `
        border-quanta-pigeon bg-quanta-snow
        group-pressed:border-quanta-silver
      `,
      true: `
        border-quanta-sapphire bg-quanta-sapphire
        group-pressed:border-quanta-sapphire
        forced-colors:![--color:Highlight]
      `,
    },
    isInvalid: {
      true: `
        group-pressed:border-quanta-ruby
        border-quanta-ruby
        forced-colors:![--color:Mark]
      `,
    },
    isDisabled: {
      true: `
        border-quanta-silver bg-quanta-smoke
        forced-colors:![--color:GrayText]
      `,
    },
  },
});

const iconStyles =
  'w-4 h-4 text-white group-disabled:text-quanta-iron forced-colors:text-[HighlightText]';

export interface CheckboxProps extends CheckboxFieldProps {
  children?: React.ReactNode;
  description?: string;
  errorMessage?: string | ((validation: ValidationResult) => string);
}

export function Checkbox(props: CheckboxProps) {
  return (
    <CheckboxField {...props} className="group flex flex-col gap-1">
      <CheckboxButton
        className={composeRenderProps(
          props.className,
          (className, renderProps) =>
            checkboxStyles({ ...renderProps, className }),
        )}
      >
        {composeRenderProps(
          props.children,
          (children, { isSelected, isIndeterminate, ...renderProps }) => (
            <>
              <div
                className={boxStyles({
                  isSelected: isSelected || isIndeterminate,
                  ...renderProps,
                })}
              >
                {isIndeterminate ? (
                  <DashIcon aria-hidden className={iconStyles} />
                ) : isSelected ? (
                  <CheckboxIcon aria-hidden className={iconStyles} />
                ) : null}
              </div>
              {children}
            </>
          ),
        )}
      </CheckboxButton>
      {props.description && (
        <Description className="ms-7">{props.description}</Description>
      )}
      <FieldError className="ms-7">{props.errorMessage}</FieldError>
    </CheckboxField>
  );
}

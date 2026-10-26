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
  base: 'group flex items-center gap-3 text-sm leading-6 transition',
  variants: {
    isDisabled: {
      false: 'text-quanta-denim',
      true: `
        text-quanta-silver
        forced-colors:text-[GrayText]
      `,
    },
  },
});

const boxStyles = tv({
  extend: focusRing,
  base: 'flex size-4.5 shrink-0 items-center justify-center rounded-[3px] border transition',
  variants: {
    isSelected: {
      false: `
        border-quanta-dolphin bg-quanta-air
        group-hover:border-quanta-sapphire
        group-pressed:border-2 group-pressed:border-quanta-cobalt
      `,
      true: `
        border-quanta-sapphire bg-quanta-sapphire
        group-hover:border-quanta-royal group-hover:bg-quanta-royal
        group-pressed:border-quanta-cobalt group-pressed:bg-quanta-cobalt
        forced-colors:![--color:Highlight]
      `,
    },
    isInvalid: {
      true: `
        border-quanta-candy
        group-hover:border-quanta-candy
        forced-colors:![--color:Mark]
      `,
    },
    isDisabled: {
      true: `
        border-quanta-smoke
        group-hover:border-quanta-smoke
        forced-colors:![--color:GrayText]
      `,
    },
  },
  compoundVariants: [
    {
      isSelected: true,
      isInvalid: true,
      class: `
        bg-quanta-candy
        group-hover:bg-quanta-candy
      `,
    },
    {
      isSelected: true,
      isDisabled: true,
      class: `
        bg-quanta-smoke
        group-hover:bg-quanta-smoke
      `,
    },
  ],
});

const iconStyles =
  'size-3.5 text-quanta-air forced-colors:text-[HighlightText]';

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
      <FieldError className="ms-7.5">{props.errorMessage}</FieldError>
      {props.description && (
        <Description className="ms-7.5">{props.description}</Description>
      )}
    </CheckboxField>
  );
}

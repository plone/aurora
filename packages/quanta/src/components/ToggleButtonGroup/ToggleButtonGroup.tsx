import React from 'react';
import {
  ToggleButtonGroup as RACToggleButtonGroup,
  type ToggleButtonGroupProps,
} from 'react-aria-components';
import { composeTailwindRenderProps } from '../../utils';

/**
 * A set of toggle buttons shown as one segmented control. With
 * `selectionMode="single"` it works like a compact radio group, e.g. for
 * filters: "All · Custom · Not addable".
 */
export function ToggleButtonGroup(props: ToggleButtonGroupProps) {
  return (
    <RACToggleButtonGroup
      {...props}
      className={composeTailwindRenderProps(
        props.className,
        `
          inline-flex overflow-hidden rounded-md border border-quanta-silver bg-quanta-air
          *:not-last:border-r *:not-last:border-quanta-silver
          data-[orientation=vertical]:flex-col data-[orientation=vertical]:*:not-last:border-r-0
          data-[orientation=vertical]:*:not-last:border-b
        `,
      )}
    />
  );
}

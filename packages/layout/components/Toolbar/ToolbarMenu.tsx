/**
 * A Menu component for use inside the Toolbar.
 *
 * Without Shadow DOM, React Aria's MenuTrigger works as-is — no custom
 * open/close wiring, no event-retargeting patches needed.
 *
 * The `styles` prop is vestigial (was used to inject CSS into the shadow root).
 * Import menu styles normally instead.
 */

import React from 'react';
import { type ComponentProps } from 'react';
import {
  Button,
  MenuTrigger as RACMenuTrigger,
  Popover,
} from 'react-aria-components';

export interface ToolbarMenuProps
  extends ComponentProps<typeof RACMenuTrigger> {
  icon?: React.ReactNode;
  /** @deprecated Was used to inject CSS into the shadow root. Import CSS normally. */
  styles?: string;
}

export function ToolbarMenu({
  icon,
  styles: _styles,
  children,
  ...props
}: ToolbarMenuProps) {
  return (
    <RACMenuTrigger {...props}>
      <Button>{icon}</Button>
      <Popover placement="bottom start" className="toolbar-overlay">
        {children}
      </Popover>
    </RACMenuTrigger>
  );
}

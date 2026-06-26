/**
 * A free-form panel component for use inside the Toolbar.
 *
 * Without Shadow DOM, React Aria's DialogTrigger + Popover + Dialog work
 * as-is — no custom open/close wiring, no portal hacks, no offsetParent
 * workarounds needed. Select, ComboBox, and any other RAC component placed
 * inside renders and positions correctly out of the box.
 *
 * The `styles` prop is vestigial (was used to inject CSS into the shadow root).
 * Import CSS normally instead.
 *
 *   import './MyPanel.css';
 *
 *   <ToolbarPopover icon={<MyIcon />} className="my-panel">
 *     <MyPanelContent />
 *   </ToolbarPopover>
 */

import React from 'react';
import { Button, Dialog, DialogTrigger, Popover } from 'react-aria-components';

export interface ToolbarPopoverProps {
  icon?: React.ReactNode;
  /** @deprecated Was used to inject CSS into the shadow root. Import CSS normally. */
  styles?: string;
  className?: string;
  children?: React.ReactNode;
}

export function ToolbarPopover({
  icon,
  styles: _styles,
  className,
  children,
}: ToolbarPopoverProps) {
  return (
    <DialogTrigger>
      <Button>{icon}</Button>
      <Popover placement="bottom start" className="toolbar-overlay">
        <Dialog className={className}>{children}</Dialog>
      </Popover>
    </DialogTrigger>
  );
}

/**
 * A free-form panel component designed for use inside the Toolbar's shadow DOM.
 *
 * Uses DialogTrigger + Popover + Dialog instead of MenuTrigger + Menu, so any
 * content (Select, links, form controls) can live inside without conflicting
 * with Menu's collection context.
 *
 * All shadow DOM workarounds (open/close state, outside-click detection,
 * Tab trapping, focus-on-open, focus-restore-on-close) are handled by
 * `useToolbarOverlay` with `mode='popover'`. Nested RAC overlays (Select,
 * ComboBox, etc.) portal into the shadow root automatically via the toolbar's
 * UNSAFE_PortalProvider.
 *
 * Pass custom CSS via the `styles` prop (imported with `?inline`) — it will
 * be injected into the shadow root automatically:
 *
 *   import panelStyles from './MyPanel.css?inline';
 *
 *   <ToolbarPopover icon={<MyIcon />} className="my-panel" styles={panelStyles}>
 *     <MyPanelContent />
 *   </ToolbarPopover>
 */

import React from 'react';
import { Button, Dialog, DialogTrigger, Popover } from 'react-aria-components';
import { useToolbarOverlay } from './useToolbarOverlay';

export interface ToolbarPopoverProps {
  icon?: React.ReactNode;
  /** CSS string (imported with `?inline`) to inject into the shadow root. */
  styles?: string;
  className?: string;
  children?: React.ReactNode;
}

export function ToolbarPopover({
  icon,
  styles,
  className,
  children,
}: ToolbarPopoverProps) {
  const { isOpen, onOpenChange, triggerRef, overlayRef } =
    useToolbarOverlay('popover');

  return (
    <>
      {styles && <style>{styles}</style>}
      <DialogTrigger isOpen={isOpen} onOpenChange={onOpenChange}>
        <Button ref={triggerRef}>{icon}</Button>
        <Popover ref={overlayRef} placement="bottom start" isNonModal>
          <Dialog className={className}>{children}</Dialog>
        </Popover>
      </DialogTrigger>
    </>
  );
}

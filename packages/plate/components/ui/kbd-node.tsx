import type { PlateLeafProps } from 'platejs/react';

import { PlateLeaf } from 'platejs/react';

export function KbdLeaf(props: PlateLeafProps) {
  return (
    <PlateLeaf {...props} as="kbd">
      {props.children}
    </PlateLeaf>
  );
}

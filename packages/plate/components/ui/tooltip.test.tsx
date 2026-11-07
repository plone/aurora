import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip';

vi.stubGlobal(
  'ResizeObserver',
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
);

describe('TooltipContent', () => {
  it('ignores pointer events', () => {
    render(
      <Tooltip open>
        <TooltipTrigger>Grip</TooltipTrigger>
        <TooltipContent>Drag to move</TooltipContent>
      </Tooltip>,
    );

    const content = document.querySelector('[data-slot="tooltip-content"]');

    expect(content).toHaveClass('pointer-events-none');
  });
});

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { BlockWidthToolbarButton } from './block-width-toolbar-button';
import { Toolbar } from './toolbar';

// The block width button with a block that has several widths, at the top
// level and inside a container.

const state = vi.hoisted(() => ({ path: [0] as number[] }));

vi.mock('platejs/react', () => ({
  useEditorPlugin: () => ({
    editor: {
      api: { block: () => [{ type: 'h2' }, state.path] },
      tf: { focus: vi.fn() },
    },
    tf: { blockWidth: { resetWidth: vi.fn(), setWidth: vi.fn() } },
  }),
  useSelectionFragmentProp: () => 'default',
}));

vi.mock('@plone/icons', () => ({
  WidthDefaultIcon: () => <span>default-icon</span>,
  WidthFullIcon: () => <span>full-icon</span>,
  WidthLayoutIcon: () => <span>layout-icon</span>,
  WidthNarrowIcon: () => <span>narrow-icon</span>,
}));

vi.mock('../editor/plugins/block-width-plugin', () => ({
  BlockWidthPlugin: {},
  getDefaultBlockWidth: () => 'default',
  getBlockWidthConfig: () => ({
    defaultWidth: 'default',
    widths: ['narrow', 'default'],
  }),
  getBlockWidthOptions: () => [
    { label: 'Narrow', value: 'narrow' },
    { label: 'Default', value: 'default' },
  ],
}));

// A block deeper than the top level sits in a container.
vi.mock('../editor/plugins/containers/registry', () => ({
  getBlockContainer: (_editor: unknown, path: number[]) =>
    path.length > 1 ? { spec: { type: 'accordion' } } : undefined,
}));

describe('BlockWidthToolbarButton in a container', () => {
  it('offers the widths of a top-level block', () => {
    state.path = [0];
    render(
      <Toolbar>
        <BlockWidthToolbarButton />
      </Toolbar>,
    );
    expect(screen.getByLabelText('Reset block width')).toBeTruthy();
  });

  it('offers no width for a block inside a container', () => {
    state.path = [0, 0, 1, 0];
    render(
      <Toolbar>
        <BlockWidthToolbarButton />
      </Toolbar>,
    );
    expect(screen.queryByLabelText('Reset block width')).toBeNull();
    expect(screen.queryByLabelText('Block width')).toBeNull();
  });
});

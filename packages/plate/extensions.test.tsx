import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createPlatePlugin } from 'platejs/react';

import {
  composeEditorExtensions,
  composeRendererExtensions,
  type PlateEditorExtension,
  type PlateRendererExtension,
} from './extensions';
import type { SlashMenuGroup } from './components/editor/plugins/slash-menu';

const plugin = (key: string) => createPlatePlugin({ key });
const keys = (plugins: Array<{ key: string }>) => plugins.map((p) => p.key);
const modules = (...extensions: unknown[]) =>
  extensions.map((module, index) => ({ addon: `addon-${index}`, module }));

describe('composeEditorExtensions', () => {
  it('without add-ons, leaves the core untouched', () => {
    const core = [plugin('a')];
    const Buttons = () => null;
    const extensions = composeEditorExtensions([]);

    expect(extensions.plugins(core)).toBe(core);
    expect(extensions.slashMenu).toEqual({});
    expect(extensions.floatingToolbar(Buttons)).toBe(Buttons);
  });

  it('appends plugin lists and applies plugin functions, in add-on order', () => {
    const extensions = composeEditorExtensions(
      modules(
        { plugins: [plugin('b')] } satisfies PlateEditorExtension,
        {
          plugins: (plugins) => [plugin('first'), ...plugins],
        } satisfies PlateEditorExtension,
        {},
        { plugins: [plugin('c')] } satisfies PlateEditorExtension,
      ),
    );

    expect(keys(extensions.plugins([plugin('a')]))).toEqual([
      'first',
      'a',
      'b',
      'c',
    ]);
  });

  it('chains the slash menu extensions, in add-on order', () => {
    const item = (value: string) => ({ icon: null, value, onSelect: () => {} });
    const extensions = composeEditorExtensions(
      modules(
        {
          slashMenu: {
            extendGroups: (groups) =>
              groups.map((group) => ({
                ...group,
                items: [...group.items, item('alert')],
              })),
          },
        } satisfies PlateEditorExtension,
        {
          slashMenu: {
            extendGroups: (groups) => [
              ...groups,
              { group: 'Custom', items: [item('custom')] },
            ],
          },
        } satisfies PlateEditorExtension,
      ),
    );
    const groups: SlashMenuGroup[] = [
      { group: 'Text blocks', items: [item('p')] },
    ];

    const result = extensions.slashMenu.extendGroups!(groups, {} as any, {
      hasTitleBlock: true,
    });

    expect(
      result.map(({ group, items }) => [group, items.map((i) => i.value)]),
    ).toEqual([
      ['Text blocks', ['p', 'alert']],
      ['Custom', ['custom']],
    ]);
  });

  it('wraps the floating toolbar buttons, in add-on order', () => {
    const Core = () => <span>core</span>;
    const wrap =
      (label: string): PlateEditorExtension['floatingToolbar'] =>
      (Buttons) =>
        function Wrapped() {
          return (
            <>
              <Buttons />
              <span>{label}</span>
            </>
          );
        };
    const extensions = composeEditorExtensions(
      modules(
        { floatingToolbar: wrap('first') },
        { floatingToolbar: wrap('second') },
      ),
    );
    const Buttons = extensions.floatingToolbar(Core);

    const { container } = render(<Buttons />);

    expect(container.textContent).toBe('corefirstsecond');
    expect(screen.getByText('second')).toBeInTheDocument();
  });
});

describe('composeRendererExtensions', () => {
  it('applies the add-on plugins, in add-on order', () => {
    const extensions = composeRendererExtensions(
      modules(
        { plugins: [plugin('alert')] } satisfies PlateRendererExtension,
        {
          plugins: (plugins) => plugins.filter((p) => p.key !== 'a'),
        } satisfies PlateRendererExtension,
      ),
    );

    expect(keys(extensions.plugins([plugin('a'), plugin('b')]))).toEqual([
      'b',
      'alert',
    ]);
  });
});

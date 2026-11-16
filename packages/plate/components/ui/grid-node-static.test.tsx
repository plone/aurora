import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';

import { PlateRenderer } from '../editor';

import { BaseBasicBlocksKit } from '../editor/plugins/basic-blocks-base-kit';
import { BaseGridKit } from '../editor/plugins/grid/grid-base-kit';
import { BaseStyleFieldsKit } from '../editor/plugins/style-fields-base-kit';

const p = (text: string) => ({ type: 'p', children: [{ text }] });
const column = (id: string, size: number, ...blocks: object[]) => ({
  type: 'grid_column',
  id,
  size,
  children: blocks,
});
const grid = (extra: Record<string, unknown>, ...columns: object[]) => ({
  type: 'grid',
  id: 'g',
  theme: 'default',
  gap: 'm',
  stack: true,
  ...extra,
  children: columns,
});

// The published view renders through `PlateRenderer`, as the public UI does.
const renderGrid = (value: object[]) =>
  render(
    <PlateRenderer
      editorConfig={{
        plugins: [...BaseBasicBlocksKit, ...BaseStyleFieldsKit, ...BaseGridKit],
      }}
      value={value as any}
    />,
  );

describe('grid published view', () => {
  it('renders the columns with their sizes, gap and stacking', () => {
    const { container } = renderGrid([
      grid({}, column('a', 2, p('Wide')), column('b', 1, p('Narrow'))),
    ]);
    const root = container.querySelector('.slate-grid')!;
    expect(root.getAttribute('data-gap')).toBe('m');
    expect(root.getAttribute('data-stack')).toBe('true');

    const columns = container.querySelectorAll(
      '.block-grid__columns > .block-grid__column',
    );
    expect(columns).toHaveLength(2);
    expect(columns[0].getAttribute('data-size')).toBe('2');
    expect(
      (columns[0] as HTMLElement).style.getPropertyValue(
        '--block-grid-column-size',
      ),
    ).toBe('2');
    expect(columns[1]).toHaveTextContent('Narrow');
  });

  it('marks a grid that keeps its columns in a row', () => {
    const { container } = renderGrid([
      grid({ stack: false, gap: 'l' }, column('a', 1, p('One'))),
    ]);
    const root = container.querySelector('.slate-grid')!;
    expect(root.getAttribute('data-stack')).toBe('false');
    expect(root.getAttribute('data-gap')).toBe('l');
  });

  it('renders the headline as a level 2 heading', () => {
    renderGrid([
      grid({ headline: 'Opening hours' }, column('a', 1, p('Monday'))),
    ]);
    expect(
      screen.getByRole('heading', { level: 2, name: 'Opening hours' }),
    ).toHaveClass('block-grid__headline');
  });

  it('renders no heading without a headline', () => {
    renderGrid([grid({}, column('a', 1, p('Monday')))]);
    expect(screen.queryByRole('heading')).toBeNull();
  });

  it('sets the theme custom properties on the grid', () => {
    const { container } = renderGrid([
      grid({ theme: 'grey' }, column('a', 1, p('Grey'))),
    ]);
    const root = container.querySelector('.slate-grid') as HTMLElement;
    expect(root.getAttribute('data-style-theme')).toBe('grey');
    expect(root.style.getPropertyValue('--theme-color')).toBe('#ecebeb');
    expect(root.style.getPropertyValue('--theme-foreground-color')).toBe(
      '#000000',
    );
  });

  it('keeps the columns in the order of the content', () => {
    const { container } = renderGrid([
      grid(
        {},
        column('a', 1, p('First')),
        column('b', 3, p('Second')),
        column('c', 1, p('Third')),
      ),
    ]);
    expect(
      [...container.querySelectorAll('.block-grid__column')].map(
        (item) => item.textContent,
      ),
    ).toEqual(['First', 'Second', 'Third']);
  });

  it('has no accessibility violations', async () => {
    const { container } = renderGrid([
      grid(
        { headline: 'Opening hours', theme: 'grey' },
        column('a', 2, p('Monday to Friday')),
        column('b', 1, p('Weekends')),
      ),
    ]);
    expect(await axe(container)).toHaveNoViolations();
  });
});

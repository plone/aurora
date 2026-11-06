import { afterEach, describe, expect, it } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';

import { PlateRenderer } from '../editor';

import { BaseBasicBlocksKit } from '../editor/plugins/basic-blocks-base-kit';
import { BaseAccordionKit } from '../editor/plugins/accordion/accordion-base-kit';
import { BaseAccordionPlugin } from '../editor/plugins/accordion/accordion-plugin';

const p = (text: string) => ({ type: 'p', children: [{ text }] });
const panel = (
  id: string,
  title: string,
  { startOpen = false, anchor = '' } = {},
) => ({
  type: 'accordion_panel',
  id,
  startOpen,
  anchor,
  children: [
    { type: 'accordion_panel_title', children: [{ text: title }] },
    { type: 'accordion_panel_content', children: [p(`${title} body`)] },
  ],
});
const accordion = (
  panels: object[],
  { exclusive = true, theme = 'white' } = {},
) => ({ type: 'accordion', id: 'acc', exclusive, theme, children: panels });

// The published view renders through `PlateRenderer`, as the public UI does.
const renderAccordion = (value: object[], plugins: any[] = []) =>
  render(
    <PlateRenderer
      editorConfig={{
        plugins: [...BaseBasicBlocksKit, ...BaseAccordionKit, ...plugins],
      }}
      value={value as any}
    />,
  );

const trigger = (name: string) => screen.getByRole('button', { name });

afterEach(() => {
  window.location.hash = '';
});

describe('accordion published view', () => {
  it('renders each title as a heading with a button that controls a region', () => {
    renderAccordion([accordion([panel('a', 'First', { startOpen: true })])]);

    const button = trigger('First');
    expect(button.closest('h3')).toHaveClass('block-accordion__heading');
    expect(button).toHaveAttribute('aria-expanded', 'true');

    const region = screen.getByRole('region', { name: 'First' });
    expect(button).toHaveAttribute('aria-controls', region.id);
    expect(region).toHaveClass('block-accordion__content');
    expect(region).not.toHaveAttribute('hidden');
  });

  it('keeps closed panels findable with hidden="until-found"', () => {
    const { container } = renderAccordion([accordion([panel('a', 'First')])]);

    expect(trigger('First')).toHaveAttribute('aria-expanded', 'false');
    const region = container.querySelector('.block-accordion__content');
    expect(region).toHaveAttribute('hidden', 'until-found');

    act(() => {
      region!.dispatchEvent(new Event('beforematch'));
    });
    expect(trigger('First')).toHaveAttribute('aria-expanded', 'true');
  });

  it('opens only the first panel marked to start open when only one can be open', () => {
    renderAccordion([
      accordion([
        panel('a', 'First', { startOpen: true }),
        panel('b', 'Second', { startOpen: true }),
      ]),
    ]);

    expect(trigger('First')).toHaveAttribute('aria-expanded', 'true');
    expect(trigger('Second')).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes the open panel when another one opens, when only one can be open', () => {
    renderAccordion([
      accordion([
        panel('a', 'First', { startOpen: true }),
        panel('b', 'Second'),
      ]),
    ]);

    fireEvent.click(trigger('Second'));
    expect(trigger('First')).toHaveAttribute('aria-expanded', 'false');
    expect(trigger('Second')).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(trigger('Second'));
    expect(trigger('Second')).toHaveAttribute('aria-expanded', 'false');
  });

  it('opens panels independently when several can be open', () => {
    renderAccordion([
      accordion(
        [
          panel('a', 'First', { startOpen: true }),
          panel('b', 'Second', { startOpen: true }),
        ],
        { exclusive: false },
      ),
    ]);

    expect(trigger('First')).toHaveAttribute('aria-expanded', 'true');
    expect(trigger('Second')).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(trigger('First'));
    expect(trigger('First')).toHaveAttribute('aria-expanded', 'false');
    expect(trigger('Second')).toHaveAttribute('aria-expanded', 'true');
  });

  it('opens the panel whose anchor is in the URL', () => {
    window.location.hash = '#how-to-find-us';
    const { container } = renderAccordion([
      accordion([
        panel('a', 'First', { startOpen: true }),
        panel('b', 'How to find us', { anchor: 'how-to-find-us' }),
      ]),
    ]);

    expect(container.querySelector('#how-to-find-us')).toHaveClass(
      'block-accordion__panel',
    );
    expect(trigger('How to find us')).toHaveAttribute('aria-expanded', 'true');
    expect(trigger('First')).toHaveAttribute('aria-expanded', 'false');
  });

  it('opens the panel whose anchor a link points to', () => {
    renderAccordion([
      accordion([panel('a', 'Contact', { anchor: 'contact' })]),
    ]);

    act(() => {
      window.location.hash = '#contact';
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
    expect(trigger('Contact')).toHaveAttribute('aria-expanded', 'true');
  });

  it('sets the background of its theme', () => {
    const { container } = renderAccordion([
      accordion([panel('a', 'First')], { theme: 'grey' }),
    ]);

    const root = container.querySelector('.slate-accordion') as HTMLElement;
    expect(root).toHaveAttribute('data-theme', 'grey');
    expect(root).toHaveAttribute('data-exclusive', 'true');
    expect(root.style.getPropertyValue('--block-accordion-background')).toBe(
      '#ecebeb',
    );
    expect(root.style.getPropertyValue('--theme-color')).toBe('#ecebeb');
  });

  it('uses the heading level of the plugin options', () => {
    renderAccordion(
      [accordion([panel('a', 'First')])],
      [BaseAccordionPlugin.configure({ options: { headingLevel: 4 } })],
    );

    expect(trigger('First').closest('h4')).not.toBeNull();
  });

  it('marks the empty paragraphs of a panel, which it does not show', () => {
    const { container } = renderAccordion([
      accordion([
        {
          ...panel('a', 'First', { startOpen: true }),
          children: [
            { type: 'accordion_panel_title', children: [{ text: 'First' }] },
            {
              type: 'accordion_panel_content',
              children: [p('Text'), p('')],
            },
          ],
        },
      ]),
      p(''),
    ]);

    const paragraphs = container.querySelectorAll('.slate-p');
    expect(paragraphs).toHaveLength(3);
    expect(paragraphs[0]).not.toHaveAttribute('data-empty');
    expect(paragraphs[1]).toHaveAttribute('data-empty', 'true');
    // Only the paragraphs of a panel.
    expect(paragraphs[2]).not.toHaveAttribute('data-empty');
  });

  it('has no accessibility violations', async () => {
    const { container } = renderAccordion([
      accordion([
        panel('a', 'First', { startOpen: true }),
        panel('b', 'Second'),
      ]),
    ]);

    expect(await axe(container)).toHaveNoViolations();
  });
});

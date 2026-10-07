import '@testing-library/jest-dom';
import { describe, expect, test } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, RouterProvider, createMemoryRouter } from 'react-router';
import Navigation from './Navigation';
import type { SlotComponentProps } from '../SlotRenderer';

// The five-item tree of the live salomonjakobsson /en root — the set whose
// unwrapped row overflowed a 386 px header (DR-2026-349 diagnosis).
const content = {
  '@components': {
    navigation: {
      items: [
        { '@id': '/en/music', title: 'Music' },
        { '@id': '/en/concerts', title: 'Concerts' },
        { '@id': '/en/about', title: 'About' },
        { '@id': '/en/press', title: 'Press' },
        { '@id': '/en/contact', title: 'Contact' },
      ],
    },
  },
} as unknown as SlotComponentProps['content'];

const location = {
  pathname: '/en',
} as unknown as SlotComponentProps['location'];

const renderAt = (path = '/en') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Navigation content={content} location={location} />
    </MemoryRouter>,
  );

// The toggle's accessible name is the i18n key's English default: with no
// i18next instance initialised, react-i18next's t() returns the defaultValue.
const toggle = () => screen.getByRole('button', { name: 'Menu' });
const list = () => document.getElementById('navigation-list') as HTMLElement;
const linkNames = () => screen.getAllByRole('link').map((a) => a.textContent);

describe('Navigation menu toggle (DR-2026-349)', () => {
  test('renders collapsed, wired to the item list', () => {
    renderAt();
    expect(toggle()).toHaveAttribute('aria-expanded', 'false');
    expect(toggle()).toHaveAttribute('aria-controls', 'navigation-list');
    expect(list()).not.toHaveAttribute('data-open');
  });

  test('opens on click and closes on a second click', () => {
    renderAt();
    fireEvent.click(toggle());
    expect(toggle()).toHaveAttribute('aria-expanded', 'true');
    expect(list()).toHaveAttribute('data-open', 'true');
    fireEvent.click(toggle());
    expect(toggle()).toHaveAttribute('aria-expanded', 'false');
    expect(list()).not.toHaveAttribute('data-open');
  });

  test('Escape on the toggle closes an open menu', () => {
    renderAt();
    fireEvent.click(toggle());
    fireEvent.keyDown(toggle(), { key: 'Escape' });
    expect(toggle()).toHaveAttribute('aria-expanded', 'false');
    expect(list()).not.toHaveAttribute('data-open');
  });

  test('Escape from a focused item closes it too', () => {
    renderAt();
    fireEvent.click(toggle());
    fireEvent.keyDown(screen.getByRole('link', { name: 'Press' }), {
      key: 'Escape',
    });
    expect(toggle()).toHaveAttribute('aria-expanded', 'false');
  });

  test('closes when the route changes', async () => {
    const router = createMemoryRouter(
      [
        {
          path: '*',
          element: <Navigation content={content} location={location} />,
        },
      ],
      { initialEntries: ['/en'] },
    );
    render(<RouterProvider router={router} />);
    fireEvent.click(toggle());
    expect(toggle()).toHaveAttribute('aria-expanded', 'true');
    await act(async () => {
      await router.navigate('/en/music');
    });
    expect(toggle()).toHaveAttribute('aria-expanded', 'false');
    expect(list()).not.toHaveAttribute('data-open');
  });
});

describe('Navigation items', () => {
  test('every item is a link in tree order, closed or open', () => {
    renderAt();
    // The links stay in the DOM while collapsed — SSR, crawlers and the
    // no-JS reader still get the tree; only the CSS hides the panel.
    expect(linkNames()).toEqual([
      'Music',
      'Concerts',
      'About',
      'Press',
      'Contact',
    ]);
    expect(screen.getByRole('link', { name: 'Contact' })).toHaveAttribute(
      'href',
      '/en/contact',
    );
    fireEvent.click(toggle());
    expect(linkNames()).toEqual([
      'Music',
      'Concerts',
      'About',
      'Press',
      'Contact',
    ]);
  });
});

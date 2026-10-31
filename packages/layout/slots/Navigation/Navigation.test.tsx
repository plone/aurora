import '@testing-library/jest-dom';
import { describe, expect, test, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router';
import Navigation from './Navigation';
import type { SlotComponentProps } from '../SlotRenderer';

// The panel renders the header tools' slots; a marker per slot is enough to
// see which ones it renders.
vi.mock('../SlotRenderer', () => ({
  default: ({ name }: { name: string }) => <span data-slot={name} />,
}));

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

// Navigation reads the root loader data, so it renders under a data router
// whose root route carries it.
const makeRouter = (path = '/en', isAuthenticated = false) =>
  createMemoryRouter(
    [
      {
        id: 'root',
        path: '*',
        element: <Navigation content={content} location={location} />,
      },
    ],
    {
      initialEntries: [path],
      hydrationData: { loaderData: { root: { isAuthenticated } } },
    },
  );

const renderAt = (path = '/en', isAuthenticated = false) =>
  render(<RouterProvider router={makeRouter(path, isAuthenticated)} />);

// The toggle's accessible name is the i18n key's English default: with no
// i18next instance initialised, react-i18next's t() returns the defaultValue.
const toggle = () => screen.getByRole('button', { name: 'Menu' });
const list = () => document.getElementById('navigation-panel') as HTMLElement;
const linkNames = () => screen.getAllByRole('link').map((a) => a.textContent);

describe('Navigation menu toggle (DR-2026-349)', () => {
  test('renders collapsed, wired to the item list', () => {
    renderAt();
    expect(toggle()).toHaveAttribute('aria-expanded', 'false');
    expect(toggle()).toHaveAttribute('aria-controls', 'navigation-panel');
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

  test('Escape from a focused item hands the focus back to the toggle', () => {
    renderAt();
    fireEvent.click(toggle());
    const press = screen.getByRole('link', { name: 'Press' });
    press.focus();
    fireEvent.keyDown(press, { key: 'Escape' });
    expect(toggle()).toHaveFocus();
  });

  test('closes when the route changes', async () => {
    const router = makeRouter();
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

describe('Navigation panel tools', () => {
  const panelSlots = () =>
    [...document.querySelectorAll('.navigation-panel-tools [data-slot]')].map(
      (el) => el.getAttribute('data-slot'),
    );

  test('the panel carries the anonymous tools and the language switcher', () => {
    renderAt('/en', false);
    expect(panelSlots()).toEqual(['anonymousTools', 'languageSwitcher']);
  });

  test('a signed-in user gets the authenticated tools instead', () => {
    renderAt('/en', true);
    expect(panelSlots()).toEqual(['authenticatedTools', 'languageSwitcher']);
  });

  test('the tools are inside the panel the toggle controls', () => {
    renderAt();
    const panel = document.getElementById(
      toggle().getAttribute('aria-controls')!,
    );
    expect(panel?.querySelector('.navigation-panel-tools')).not.toBeNull();
    expect(panel?.querySelector('#navigation-list')).not.toBeNull();
  });
});

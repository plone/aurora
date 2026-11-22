import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { MoreMenu } from './MoreMenu';

const content = {
  title: 'News',
  '@type': 'Folder',
  modified: '2026-10-27T12:00:00Z',
};
const object = [
  { id: 'history', title: 'History', url: '/news/@@historyview' },
  { id: 'local_roles', title: 'Sharing', url: '/news/@@sharing' },
];

describe('MoreMenu', () => {
  it('shows permitted default actions and changes workflow', async () => {
    const onChange = vi.fn();
    render(
      <MoreMenu
        content={content}
        path="/news"
        actions={{ object }}
        workflow={{
          state: { id: 'published', title: 'Published' },
          transitions: [{ '@id': '/news/@workflow/retract', title: 'Retract' }],
        }}
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'More' }));
    expect(
      await screen.findByRole('menuitem', { name: 'History' }),
    ).toHaveAttribute('href', '/@@history/news');
    expect(screen.getByRole('menuitem', { name: 'Sharing' })).toHaveAttribute(
      'href',
      '/@@sharing/news',
    );
    // The menu takes the focus a moment after it opens. If that happens once
    // the State submenu is open, the submenu closes.
    const menu = screen.getByRole('menu', { name: 'More' });
    await waitFor(() =>
      expect(menu).toContainElement(document.activeElement as HTMLElement),
    );
    fireEvent.click(screen.getByRole('menuitem', { name: /State.*Published/ }));
    const transition = await screen.findByRole('menuitem', { name: 'Retract' });
    await waitFor(() => expect(transition).toHaveFocus());
    fireEvent.keyDown(transition, { key: 'Enter' });
    fireEvent.keyUp(transition, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith('workflow', 'retract');
  });
  it('uses backend menu entries instead of the default links', async () => {
    render(
      <MoreMenu
        content={content}
        path="/news"
        actions={{
          object,
          more_menu: [{ id: 'custom', title: 'Custom action', url: '/custom' }],
        }}
        onChange={() => {}}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'More' }));
    expect(
      await screen.findByRole('menuitem', { name: 'Custom action' }),
    ).toHaveAttribute('href', '/custom');
    expect(
      screen.queryByRole('menuitem', { name: 'History' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('menuitem', { name: 'Sharing' }),
    ).not.toBeInTheDocument();
  });

  it('requires confirmation before discarding a working copy', async () => {
    const onChange = vi.fn();
    render(
      <MoreMenu
        content={content}
        path="/news"
        actions={{
          object_buttons: [
            { id: 'iterate_checkin', title: 'Apply', url: '/news' },
          ],
        }}
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'More' }));
    fireEvent.click(
      await screen.findByRole('menuitem', { name: 'Discard working copy' }),
    );
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.click(
      await screen.findByRole('menuitem', {
        name: 'Confirm discard working copy',
      }),
    );
    expect(onChange).toHaveBeenCalledWith('discard', 'confirm');
  });

  it('changes appearance when multiple layouts are available', async () => {
    const onChange = vi.fn();
    render(
      <MoreMenu
        content={{ ...content, layout: 'listing_view' }}
        path="/news"
        layouts={['listing_view', 'summary_view']}
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'More' }));
    fireEvent.click(
      await screen.findByRole('menuitem', { name: /Appearance.*listing_view/ }),
    );
    fireEvent.click(
      await screen.findByRole('menuitem', { name: 'summary_view' }),
    );
    expect(onChange).toHaveBeenCalledWith('layout', 'summary_view');
  });
});

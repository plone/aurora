import { fireEvent, render, screen } from '@testing-library/react';
import { PersonalTools } from './PersonalTools';

describe('PersonalTools', () => {
  it('shows logout and site setup when the user has the setup action', async () => {
    render(
      <PersonalTools
        user={{ fullname: 'Jane Smith' }}
        actions={{ user: [{ id: 'plone_setup' }] }}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Personal tools' }));
    expect(await screen.findByText('Jane Smith')).toBeInTheDocument();
    expect(
      screen.getByRole('menuitem', { name: 'Site setup' }),
    ).toHaveAttribute('href', '/controlpanel');
    expect(screen.getByRole('menuitem', { name: 'Log out' })).toHaveAttribute(
      'href',
      '/logout',
    );
  });

  it('does not show site setup without the action', async () => {
    render(<PersonalTools user={null} actions={{ personal_tools: [] }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Personal tools' }));
    expect(
      await screen.findByRole('menuitem', { name: 'Log out' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('menuitem', { name: 'Site setup' }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Profile' })).toHaveAttribute(
      'href',
      '/personal-information',
    );
  });

  it('uses personal tools actions in place of the default links', async () => {
    render(
      <PersonalTools
        user={null}
        actions={{
          user: [{ id: 'plone_setup' }],
          personal_tools: [
            {
              id: 'dashboard',
              title: 'My dashboard',
              url: '/dashboard?view=mine',
            },
            { id: 'account', title: 'Account settings', url: '/account' },
          ],
        }}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Personal tools' }));
    expect(
      await screen.findByRole('menuitem', { name: 'My dashboard' }),
    ).toHaveAttribute('href', '/dashboard?view=mine');
    expect(
      screen.getByRole('menuitem', { name: 'Account settings' }),
    ).toHaveAttribute('href', '/account');
    expect(
      screen.queryByRole('menuitem', { name: 'Profile' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('menuitem', { name: 'Site setup' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('menuitem', { name: 'Log out' }),
    ).not.toBeInTheDocument();
  });
});

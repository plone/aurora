import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createRoutesStub, Outlet, useNavigate } from 'react-router';
import type { ReactNode } from 'react';
import config from '@plone/registry';
import { TextField } from '@plone/quanta';
import { filterControlPanelsSchema } from '../config/controlpanels';
import SingleControlPanel from './controlpanel';

vi.mock('@plone/icons/svg/arrow-left.svg?react', () => ({
  default: () => <svg />,
}));
vi.mock('@plone/icons/svg/checkbox.svg?react', () => ({
  default: () => <svg />,
}));

vi.mock('@plone/layout/components/Pluggable', () => ({
  Plug: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

config.registerDefaultWidget(TextField);
config.settings.filterControlPanelsSchema = filterControlPanelsSchema;

const makePanel = (id: string, field: string, value: string) => ({
  '@id': `http://localhost:3000/@controlpanels/${id}`,
  title: `${id} settings`,
  data: { [field]: value },
  schema: {
    fieldsets: [{ id: 'default', title: 'Default', fields: [field] }],
    properties: { [field]: { title: field, type: 'string' } },
    required: [],
  },
});

const panels: Record<string, ReturnType<typeof makePanel>> = {
  navigation: makePanel('navigation', 'navigation_title', 'Main menu'),
  site: makePanel('site', 'site_title', 'My site'),
};

function Layout() {
  const navigate = useNavigate();
  return (
    <>
      <button onClick={() => navigate('/controlpanel/site')}>Go to site</button>
      <Outlet />
    </>
  );
}

const renderStub = (onSave = vi.fn()) => {
  const Stub = createRoutesStub([
    {
      Component: Layout,
      children: [
        {
          path: '/controlpanel/:id',
          Component: SingleControlPanel,
          loader: ({ params }) => ({ controlpanel: panels[params.id!] }),
          action: async ({ request }) => {
            onSave(await request.json());
            return null;
          },
        },
      ],
    },
  ]);
  render(<Stub initialEntries={['/controlpanel/navigation']} />);
  return onSave;
};

describe('Control panel route', () => {
  it('shows the values of each panel when moving between panels', async () => {
    renderStub();

    expect(await screen.findByLabelText('navigation_title')).toHaveValue(
      'Main menu',
    );

    fireEvent.click(screen.getByText('Go to site'));

    expect(await screen.findByLabelText('site_title')).toHaveValue('My site');
  });

  it('submits the edited values of the current panel', async () => {
    const onSave = renderStub();

    fireEvent.click(await screen.findByText('Go to site'));
    const input = await screen.findByLabelText('site_title');
    fireEvent.change(input, { target: { value: 'Renamed site' } });
    fireEvent.click(screen.getByRole('button', { name: 'cmsui.save' }));

    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith({ site_title: 'Renamed site' }),
    );
  });
});

import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { ControlPanelsProvider } from '../../../provider/ControlPanelsProvider';
import { ContentTypesDriverProvider, NO_CAPABILITIES } from '../../driver';
import type { ContentTypesDriver } from '../../driver';
import { createMockDriver } from '../../mock/createMockDriver';
import { ContentTypesList } from './ContentTypesList';

function renderList(driver: ContentTypesDriver = createMockDriver()) {
  const navigate = vi.fn();
  const notify = vi.fn();
  render(
    <ControlPanelsProvider navigate={navigate} notify={notify}>
      <ContentTypesDriverProvider driver={driver}>
        <ContentTypesList />
      </ContentTypesDriverProvider>
    </ControlPanelsProvider>,
  );
  return { driver, navigate, notify };
}

const header = (name: string) =>
  screen.queryByRole('rowheader', { name: new RegExp(`^${name}`) });
const row = (name: string) =>
  header(name)!.closest('[role="row"]') as HTMLElement;
const loaded = () => screen.findByRole('rowheader', { name: /^Event/ });

describe('ContentTypesList', () => {
  it('lists the types, linking each to its Settings tab', async () => {
    renderList();
    expect(await loaded()).toBeInTheDocument();
    expect(row('Event')).toHaveAttribute(
      'data-href',
      '/controlpanel/content-types/Event/settings',
    );
    expect(within(row('Page')).getByText('3')).toBeInTheDocument();
  });

  it('filters by name and short name', async () => {
    renderList();
    await loaded();
    fireEvent.change(screen.getByRole('searchbox', { name: 'Filter types' }), {
      target: { value: 'news' },
    });
    expect(header('News Item')).toBeInTheDocument();
    expect(header('Event')).toBeNull();
  });

  it('switches addability in place, without leaving the list', async () => {
    const { driver, navigate } = renderList();
    const updateType = vi.spyOn(driver, 'updateType');
    await loaded();
    fireEvent.click(
      screen.getByRole('switch', { name: 'Link: globally addable' }),
    );
    await waitFor(() =>
      expect(updateType).toHaveBeenCalledWith('Link', { globalAllow: false }),
    );
    expect(navigate).not.toHaveBeenCalled();
    expect(
      screen.getByRole('radio', { name: 'Not addable 3' }),
    ).toBeInTheDocument();
  });

  it('puts a failed change back', async () => {
    const driver = createMockDriver();
    driver.updateType = () => Promise.reject(new Error('Forbidden'));
    const { notify } = renderList(driver);
    await loaded();
    const toggle = screen.getByRole('switch', {
      name: 'Link: globally addable',
    });
    fireEvent.click(toggle);
    await waitFor(() =>
      expect(notify).toHaveBeenCalledWith(
        expect.objectContaining({ variant: 'error' }),
      ),
    );
    expect(toggle).toBeChecked();
  });

  it('leaves out what a basic backend lacks', async () => {
    renderList(createMockDriver({ capabilities: NO_CAPABILITIES }));
    await loaded();
    expect(screen.queryByRole('columnheader', { name: 'Workflow' })).toBeNull();
    expect(screen.queryByRole('columnheader', { name: 'Addable' })).toBeNull();
    expect(screen.queryByRole('switch')).toBeNull();
    expect(screen.queryByText('Site defaults')).toBeNull();
  });

  it('creates a type and goes to its Fields tab', async () => {
    const { navigate, notify } = renderList();
    await loaded();
    fireEvent.click(screen.getByRole('button', { name: 'Add content type' }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByRole('textbox', { name: /^Name/ }), {
      target: { value: 'Meeting minutes' },
    });
    expect(
      within(dialog).getByRole('textbox', { name: /^Short name/ }),
    ).toHaveValue('meeting_minutes');
    await act(async () => {
      fireEvent.click(
        within(dialog).getByRole('button', { name: 'Create and add fields' }),
      );
    });
    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith(
        '/controlpanel/content-types/meeting_minutes/fields',
      ),
    );
    expect(notify).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Meeting minutes created' }),
    );
  });

  it("doesn't let a short name be used twice", async () => {
    renderList();
    await loaded();
    fireEvent.click(screen.getByRole('button', { name: 'Add content type' }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByRole('textbox', { name: /^Name/ }), {
      target: { value: 'Link' },
    });
    fireEvent.change(
      within(dialog).getByRole('textbox', { name: /^Short name/ }),
      { target: { value: 'Link' } },
    );
    expect(
      within(dialog).getByRole('button', { name: 'Create and add fields' }),
    ).toBeDisabled();
  });

  it("explains why types with items can't be deleted", async () => {
    const { driver } = renderList();
    const deleteType = vi.spyOn(driver, 'deleteType');
    await loaded();
    fireEvent.click(screen.getByRole('button', { name: 'Actions for Page' }));
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Delete…' }));
    const dialog = await screen.findByRole('alertdialog');
    expect(within(dialog).getByText('Page: 3 items')).toBeInTheDocument();
    expect(within(dialog).queryByRole('button', { name: 'Delete' })).toBeNull();
    expect(deleteType).not.toHaveBeenCalled();
  });

  it('deletes a type without items', async () => {
    renderList();
    await loaded();
    fireEvent.click(screen.getByRole('button', { name: 'Actions for Link' }));
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Delete…' }));
    const dialog = await screen.findByRole('alertdialog');
    await act(async () => {
      fireEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));
    });
    await waitFor(() => expect(header('Link')).toBeNull());
  });

  it('offers retrying when the types fail to load', async () => {
    const driver = createMockDriver();
    let fail = true;
    const listTypes = driver.listTypes;
    driver.listTypes = () =>
      fail ? Promise.reject(new Error('down')) : listTypes();
    renderList(driver);
    expect(await screen.findByRole('alert')).toHaveTextContent(
      "The content types couldn't be loaded.",
    );
    fail = false;
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await loaded()).toBeInTheDocument();
  });

  describe('changing workflows', () => {
    const driver = () => createMockDriver({ jobSteps: 1 });

    it('changes the workflow of the selected types', async () => {
      const { notify } = renderList(driver());
      await loaded();
      fireEvent.click(
        within(row('Page')).getByRole('checkbox', { name: /Select/ }),
      );
      fireEvent.click(
        within(row('News Item')).getByRole('checkbox', { name: /Select/ }),
      );
      fireEvent.click(screen.getByRole('button', { name: 'Change workflow…' }));

      const dialog = within(
        await screen.findByRole('dialog', {
          name: 'Change workflow for 2 types',
        }),
      );
      fireEvent.click(
        dialog.getByRole('radio', { name: /Intranet\/Extranet Workflow/ }),
      );
      await act(async () => {
        fireEvent.click(
          dialog.getByRole('button', { name: 'Next: map states' }),
        );
      });
      expect(
        await dialog.findByRole('list', { name: 'Map states' }),
      ).toBeInTheDocument();
      fireEvent.click(dialog.getByRole('button', { name: 'Next: review' }));
      expect(
        dialog.getByText(
          'These types will use Intranet/Extranet Workflow: Page, News Item.',
        ),
      ).toBeVisible();
      await act(async () => {
        fireEvent.click(
          dialog.getByRole('button', { name: 'Change workflow for 3 items' }),
        );
      });

      await waitFor(() =>
        expect(notify).toHaveBeenCalledWith(
          expect.objectContaining({
            title: '2 types now use Intranet/Extranet Workflow.',
          }),
        ),
      );
      await waitFor(() =>
        expect(row('News Item')).toHaveTextContent(
          'Intranet/Extranet Workflow',
        ),
      );
      expect(row('Event')).toHaveTextContent('Simple Publication Workflow');
    });

    it('changes the site default, and the types that follow it', async () => {
      renderList(driver());
      await loaded();
      fireEvent.click(
        screen.getByRole('button', {
          name: 'Change the site default workflow',
        }),
      );
      const dialog = within(
        await screen.findByRole('dialog', {
          name: 'Change the site default workflow',
        }),
      );
      expect(
        dialog.queryByRole('radio', { name: /Follow the site default/ }),
      ).toBeNull();
      expect(
        dialog.getByRole('radio', { name: /^Simple Publication Workflow/ }),
      ).toBeDisabled();
      fireEvent.click(
        dialog.getByRole('radio', { name: /^Single State Workflow/ }),
      );
      await act(async () => {
        fireEvent.click(
          dialog.getByRole('button', { name: 'Next: map states' }),
        );
      });
      await dialog.findByRole('list', { name: 'Map states' });
      fireEvent.click(dialog.getByRole('button', { name: 'Next: review' }));
      expect(
        dialog.getByText(/^The site default becomes Single State Workflow/),
      ).toHaveTextContent('Collection, Page, Link, News Item, Event');
      await act(async () => {
        fireEvent.click(
          dialog.getByRole('button', { name: /^Change workflow for/ }),
        );
      });

      await waitFor(() =>
        expect(
          screen.getByRole('region', { name: 'Site defaults' }),
        ).toHaveTextContent('Single State Workflow'),
      );
      // A type with a workflow of its own keeps it.
      expect(row('Comment')).toHaveTextContent(
        'Single State Workflow for comments',
      );
    });
  });
});

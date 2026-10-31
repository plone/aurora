import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import {
  ControlPanelsProvider,
  type UseBlocker,
} from '../../../provider/ControlPanelsProvider';
import { ContentTypesDriverProvider, NO_CAPABILITIES } from '../../driver';
import type { ContentTypesDriver } from '../../driver';
import { createMockDriver } from '../../mock/createMockDriver';
import { ContentTypePage } from './ContentTypePage';

function renderPage({
  driver = createMockDriver(),
  id = 'Event',
  useBlocker,
}: {
  driver?: ContentTypesDriver;
  id?: string;
  useBlocker?: UseBlocker;
} = {}) {
  const notify = vi.fn();
  render(
    <ControlPanelsProvider
      navigate={vi.fn()}
      notify={notify}
      useBlocker={useBlocker}
    >
      <ContentTypesDriverProvider driver={driver}>
        <ContentTypePage id={id} />
      </ContentTypesDriverProvider>
    </ControlPanelsProvider>,
  );
  return { driver, notify };
}

const description = () => screen.getByRole('textbox', { name: 'Description' });

describe('ContentTypePage', () => {
  it('shows the type with a tab per part, each with its own URL', async () => {
    renderPage();
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Event' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Fields' })).toHaveAttribute(
      'href',
      '/controlpanel/content-types/Event/fields',
    );
    expect(screen.getByRole('tab', { name: 'Settings' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('collects changes, marks the tab and saves only what changed', async () => {
    const { driver, notify } = renderPage();
    const updateType = vi.spyOn(driver, 'updateType');
    await screen.findByRole('heading', { level: 1, name: 'Event' });
    expect(
      screen.queryByRole('region', { name: 'Unsaved changes' }),
    ).toBeNull();

    fireEvent.change(description(), { target: { value: 'Happenings' } });

    const bar = screen.getByRole('region', { name: 'Unsaved changes' });
    expect(bar).toHaveTextContent('Unsaved changes in Settings');
    expect(
      within(screen.getByRole('tab', { name: /Settings/ })).getByRole('img', {
        name: 'Unsaved changes',
      }),
    ).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(within(bar).getByRole('button', { name: 'Save' }));
    });
    await waitFor(() =>
      expect(updateType).toHaveBeenCalledWith('Event', {
        description: 'Happenings',
      }),
    );
    await waitFor(() =>
      expect(
        screen.queryByRole('region', { name: 'Unsaved changes' }),
      ).toBeNull(),
    );
    expect(notify).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Event saved' }),
    );
    expect(
      screen.getByText('Happenings', { selector: 'p' }),
    ).toBeInTheDocument();
  });

  it('discards changes', async () => {
    renderPage();
    await screen.findByRole('heading', { level: 1, name: 'Event' });
    fireEvent.change(description(), { target: { value: 'Happenings' } });
    fireEvent.click(screen.getByRole('button', { name: 'Discard' }));
    expect(description()).toHaveValue('Events can be shown in calendars.');
    expect(
      screen.queryByRole('region', { name: 'Unsaved changes' }),
    ).toBeNull();
  });

  it('keeps the changes when saving fails', async () => {
    const driver = createMockDriver();
    driver.updateType = () => Promise.reject(new Error('Forbidden'));
    const { notify } = renderPage({ driver });
    await screen.findByRole('heading', { level: 1, name: 'Event' });
    fireEvent.change(description(), { target: { value: 'Happenings' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    });
    await waitFor(() =>
      expect(notify).toHaveBeenCalledWith(
        expect.objectContaining({ variant: 'error' }),
      ),
    );
    expect(description()).toHaveValue('Happenings');
    expect(
      screen.getByRole('region', { name: 'Unsaved changes' }),
    ).toBeInTheDocument();
  });

  it('asks before leaving with unsaved changes', async () => {
    const proceed = vi.fn();
    const cancel = vi.fn();
    // Like the app's router after following a link elsewhere: it blocks if
    // the page says to.
    const nextPath = '/controlpanel';
    const useBlocker: UseBlocker = (shouldBlock) => ({
      isBlocked: shouldBlock(nextPath),
      proceed,
      cancel,
    });
    renderPage({ useBlocker });
    await screen.findByRole('heading', { level: 1, name: 'Event' });
    expect(screen.queryByRole('alertdialog')).toBeNull();

    fireEvent.change(description(), { target: { value: 'Happenings' } });

    const dialog = await screen.findByRole('alertdialog', {
      name: 'Leave without saving?',
    });
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Discard changes' }),
    );
    expect(proceed).toHaveBeenCalled();
  });

  it("keeps the changes while moving between the type's tabs", async () => {
    const useBlocker: UseBlocker = (shouldBlock) => ({
      isBlocked: shouldBlock('/controlpanel/content-types/Event/fields'),
      proceed: vi.fn(),
      cancel: vi.fn(),
    });
    renderPage({ useBlocker });
    await screen.findByRole('heading', { level: 1, name: 'Event' });
    fireEvent.change(description(), { target: { value: 'Happenings' } });
    expect(screen.queryByRole('alertdialog')).toBeNull();
  });

  it('chooses which types can be added inside', async () => {
    const { driver } = renderPage();
    const updateType = vi.spyOn(driver, 'updateType');
    await screen.findByRole('heading', { level: 1, name: 'Event' });
    const allowed = screen.getByRole('radiogroup', { name: 'Allowed inside' });
    expect(
      within(allowed).getByRole('radio', { name: 'Only selected types' }),
    ).toBeChecked();
    expect(screen.getByText('Image')).toBeInTheDocument();

    fireEvent.click(within(allowed).getByRole('radio', { name: 'Nothing' }));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    });
    await waitFor(() =>
      expect(updateType).toHaveBeenCalledWith('Event', {
        allowedContents: { mode: 'none' },
      }),
    );
  });

  it('leaves out the settings a basic backend lacks', async () => {
    renderPage({ driver: createMockDriver({ capabilities: NO_CAPABILITIES }) });
    await screen.findByRole('heading', { level: 1, name: 'Event' });
    expect(screen.queryByRole('switch')).toBeNull();
    expect(screen.queryByRole('radiogroup', { name: 'Versioning' })).toBeNull();
    expect(
      screen.getByText(/need a newer version of the content API/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('radiogroup', { name: 'Allowed inside' }),
    ).toBeInTheDocument();
  });

  it('only offers settings for types that are not Dexterity types', async () => {
    renderPage({ id: 'Discussion Item' });
    await screen.findByRole('heading', { level: 1, name: 'Comment' });
    expect(screen.getByRole('tab', { name: 'Fields' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });
});

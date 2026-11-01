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
import { createMockDriver } from '../../mock/createMockDriver';
import { ContentTypePage } from '../ContentTypePage/ContentTypePage';

function renderBehaviors(driver = createMockDriver()) {
  const notify = vi.fn();
  render(
    <ControlPanelsProvider navigate={vi.fn()} notify={notify}>
      <ContentTypesDriverProvider driver={driver}>
        <ContentTypePage id="Event" tab="behaviors" />
      </ContentTypesDriverProvider>
    </ControlPanelsProvider>,
  );
  return { driver, notify };
}

const formList = () =>
  screen.findByRole('grid', { name: 'Add fields to the form' });
const order = async () =>
  within(await formList())
    .getAllByRole('row')
    .map((row) => row.getAttribute('data-key'));

async function save() {
  const bar = screen.getByRole('region', { name: 'Unsaved changes' });
  expect(bar).toHaveTextContent('Unsaved changes in Behaviors');
  await act(async () => {
    fireEvent.click(within(bar).getByRole('button', { name: 'Save' }));
  });
  await waitFor(() =>
    expect(
      screen.queryByRole('region', { name: 'Unsaved changes' }),
    ).toBeNull(),
  );
}

describe('BehaviorsTab', () => {
  it('lists the behaviors that add fields in order, and the features', async () => {
    renderBehaviors();
    expect((await order()).slice(0, 2)).toEqual([
      'plone.eventbasic',
      'plone.eventrecurrence',
    ]);
    expect(
      within(await formList()).getByRole('row', { name: /Event Location/ }),
    ).toHaveTextContent('Adds Location');
    const features = screen.getByRole('list', { name: 'Features' });
    expect(within(features).getByText('Locking')).toBeInTheDocument();
    expect(
      screen.getByText('17 on · 14 add fields · 3 features'),
    ).toBeVisible();
    expect(
      screen.getByRole('complementary', { name: 'Edit form preview' }),
    ).toHaveTextContent('Registration required');
  });

  it('moves a behavior with Alt and an arrow key, and saves the order', async () => {
    const { driver } = renderBehaviors();
    const updateType = vi.spyOn(driver, 'updateType');
    const row = within(await formList()).getByRole('row', {
      name: /Event Recurrence/,
    });
    act(() => row.focus());
    fireEvent.keyDown(row, { key: 'ArrowUp', altKey: true });
    expect((await order()).slice(0, 2)).toEqual([
      'plone.eventrecurrence',
      'plone.eventbasic',
    ]);

    await save();
    const [, changes] = updateType.mock.calls[0];
    expect(changes.behaviors?.slice(0, 2)).toEqual([
      'plone.eventrecurrence',
      'plone.eventbasic',
    ]);
  });

  it('removes a behavior and says what editors lose', async () => {
    const { notify } = renderBehaviors();
    fireEvent.click(
      await screen.findByRole('button', { name: 'Remove Event Contact' }),
    );
    expect(await order()).not.toContain('plone.eventcontact');
    expect(notify).toHaveBeenCalledWith({
      title: 'Event Contact removed',
      description:
        'Editors no longer see its 4 fields. Stored values are kept.',
    });
    await waitFor(() =>
      expect(
        screen.getByRole('complementary', { name: 'Edit form preview' }),
      ).not.toHaveTextContent('Contact Phone'),
    );
  });

  it('switches a behavior to its other variant in place', async () => {
    renderBehaviors();
    const variants = await screen.findByRole('radiogroup', {
      name: 'Variant of Blocks',
    });
    const before = await order();
    fireEvent.click(
      within(variants).getByRole('radio', { name: 'Blocks (Editable Layout)' }),
    );
    const after = await order();
    expect(after.indexOf('volto.blocks.editable.layout')).toBe(
      before.indexOf('volto.blocks'),
    );
  });

  it('adds behaviors, explaining the ones that overlap', async () => {
    renderBehaviors();
    fireEvent.click(
      await screen.findByRole('button', { name: 'Add behaviors' }),
    );
    const dialog = await screen.findByRole('dialog', {
      name: 'Add behaviors to Event',
    });

    const basic = within(dialog).getByRole('row', {
      name: /Basic metadata/,
    });
    fireEvent.click(basic);
    // It stays focusable, to read why, but can't be selected.
    expect(basic).not.toHaveAttribute('aria-selected');
    expect(
      within(dialog).getAllByText('Included in Dublin Core metadata'),
    ).toHaveLength(4);
    expect(
      within(dialog).queryByRole('row', { name: /Head title/ }),
    ).toBeNull();
    fireEvent.click(
      within(dialog).getByRole('switch', { name: 'Show deprecated' }),
    );
    expect(
      within(dialog).getByText('Deprecated: use Kicker field instead.'),
    ).toBeVisible();

    fireEvent.change(
      within(dialog).getByRole('searchbox', { name: 'Search behaviors' }),
      { target: { value: 'leadimage' } },
    );
    // The search matches ids too.
    const leadImage = within(dialog).getByRole('row', { name: /Lead Image/ });
    expect(leadImage).toHaveTextContent('plone.leadimage');
    fireEvent.click(leadImage);
    expect(leadImage).toHaveAttribute('aria-selected', 'true');
    expect(
      within(dialog).getByRole('button', { name: 'Remove Lead Image' }),
    ).toBeVisible();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Add 1' }));

    expect((await order()).at(-1)).toBe('plone.leadimage');
    await waitFor(() =>
      expect(
        screen.getByRole('complementary', { name: 'Edit form preview' }),
      ).toHaveTextContent('Lead Image'),
    );
  });

  it("works with what today's plone.restapi says", async () => {
    renderBehaviors(createMockDriver({ capabilities: NO_CAPABILITIES }));
    const list = await formList();
    expect(
      within(list).queryAllByRole('button', { name: 'Event Basic' }),
    ).toEqual([]);
    expect(
      screen.getByText(/can't change their order yet/),
    ).toBeInTheDocument();
    // What a behavior adds comes from the type's schema.
    expect(
      within(list).getByRole('row', { name: /Event Location/ }),
    ).toHaveTextContent('Adds Location');

    fireEvent.click(screen.getByRole('button', { name: 'Add behaviors' }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('row', { name: /Lead Image/ }));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Add 1' }));
    const preview = screen.getByRole('complementary', {
      name: 'Edit form preview',
    });
    expect(preview).toHaveTextContent(
      'Fields from Lead Image show after saving.',
    );
    expect(preview).toHaveTextContent(/An estimate/);
  });

  it('asks the backend for the preview when it can', async () => {
    const { driver } = renderBehaviors();
    const previewSchema = vi.spyOn(driver, 'previewSchema');
    fireEvent.click(
      await screen.findByRole('button', { name: 'Remove Event Contact' }),
    );
    await waitFor(() => expect(previewSchema).toHaveBeenCalledTimes(1));
    expect(previewSchema.mock.calls[0][1]).not.toContain('plone.eventcontact');
  });
});

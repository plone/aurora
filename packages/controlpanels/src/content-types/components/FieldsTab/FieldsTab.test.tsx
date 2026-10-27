import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { ControlPanelsProvider } from '../../../provider/ControlPanelsProvider';
import { ContentTypesDriverProvider } from '../../driver';
import { createMockDriver } from '../../mock/createMockDriver';
import { ContentTypePage } from '../ContentTypePage/ContentTypePage';

function renderFields(driver = createMockDriver()) {
  render(
    <ControlPanelsProvider navigate={vi.fn()} notify={vi.fn()}>
      <ContentTypesDriverProvider driver={driver}>
        <ContentTypePage id="Event" tab="fields" />
      </ContentTypesDriverProvider>
    </ControlPanelsProvider>,
  );
  return driver;
}

const fieldList = () =>
  screen.findByRole('grid', { name: /^Fields in / }).then((grid) => grid);
const row = async (name: string | RegExp) =>
  within(await fieldList()).getByRole('row', { name });

async function save() {
  const bar = screen.getByRole('region', { name: 'Unsaved changes' });
  expect(bar).toHaveTextContent('Unsaved changes in Fields');
  await act(async () => {
    fireEvent.click(within(bar).getByRole('button', { name: 'Save' }));
  });
  await waitFor(() =>
    expect(
      screen.queryByRole('region', { name: 'Unsaved changes' }),
    ).toBeNull(),
  );
}

describe('FieldsTab', () => {
  it('lists the fieldsets, and the fields of the selected one', async () => {
    renderFields();
    const fieldsets = await screen.findByRole('grid', { name: 'Fieldsets' });
    expect(
      within(fieldsets).getByRole('row', { name: 'Default' }),
    ).toHaveAttribute('aria-selected', 'true');
    expect(await fieldList()).toHaveAccessibleName('Fields in Default');

    // Fields from behaviors are locked, and say where they come from.
    expect(await row('Event Starts')).toHaveAttribute('aria-disabled', 'true');
    expect(await row('Event Starts')).toHaveTextContent('Event Basic');
    expect(await row('Registration required')).not.toHaveAttribute(
      'aria-disabled',
    );
    expect(await row('Registration required')).toHaveTextContent('Custom');

    fireEvent.click(within(fieldsets).getByRole('row', { name: 'Dates' }));
    expect(await fieldList()).toHaveAccessibleName('Fields in Dates');
  });

  it('edits a custom field in a side sheet, and saves it with the type', async () => {
    const driver = renderFields();
    const saveSchema = vi.spyOn(driver, 'saveSchema');
    const updateType = vi.spyOn(driver, 'updateType');

    fireEvent.click(await row('Registration required'));
    const sheet = await screen.findByRole('dialog', { name: 'Edit field' });
    fireEvent.change(within(sheet).getByRole('textbox', { name: 'Label' }), {
      target: { value: 'Sign-up required' },
    });
    fireEvent.click(within(sheet).getByRole('switch', { name: 'Required' }));
    fireEvent.click(within(sheet).getByRole('button', { name: 'Done' }));

    expect(await row('Sign-up required')).toHaveTextContent(
      'Yes/No · registration_required · required',
    );
    await save();
    expect(updateType).not.toHaveBeenCalled();
    expect(saveSchema).toHaveBeenCalledTimes(1);
    const [, schema] = saveSchema.mock.calls[0];
    expect(schema.properties.registration_required.title).toBe(
      'Sign-up required',
    );
    expect(schema.required).toContain('registration_required');
  });

  it('deletes a custom field', async () => {
    const driver = renderFields();
    fireEvent.click(await row('Registration required'));
    const sheet = await screen.findByRole('dialog', { name: 'Edit field' });
    fireEvent.click(
      within(sheet).getByRole('button', { name: 'Delete field' }),
    );
    await waitFor(() =>
      expect(
        within(
          screen.getByRole('grid', { name: 'Fields in Default' }),
        ).queryByRole('row', { name: 'Registration required' }),
      ).toBeNull(),
    );
    await save();
    expect(
      (await driver.getSchema('Event')).properties.registration_required,
    ).toBeUndefined();
  });

  it('adds a field to the selected fieldset', async () => {
    const driver = renderFields();
    const fieldsets = await screen.findByRole('grid', { name: 'Fieldsets' });
    fireEvent.click(
      within(fieldsets).getByRole('row', { name: 'Registration' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Add field' }));

    const dialog = await screen.findByRole('dialog', { name: 'Add a field' });
    fireEvent.change(within(dialog).getByRole('textbox', { name: 'Label' }), {
      target: { value: 'Seats left' },
    });
    expect(
      within(dialog).getByRole('textbox', { name: 'Short name' }),
    ).toHaveValue('seats_left');
    const add = within(dialog).getByRole('button', { name: 'Add' });
    expect(add).toBeDisabled();

    fireEvent.click(within(dialog).getByRole('button', { name: /Type/ }));
    fireEvent.click(await screen.findByRole('option', { name: 'Integer' }));
    await act(async () => {
      fireEvent.click(add);
    });

    expect(await fieldList()).toHaveAccessibleName('Fields in Registration');
    expect(await row('Seats left')).toHaveTextContent('Integer · seats_left');
    await save();
    const schema = await driver.getSchema('Event');
    expect(
      schema.fieldsets.find((fieldset) => fieldset.id === 'registration')
        ?.fields,
    ).toEqual(['seats_left']);
  });

  it("doesn't accept a short name that's taken", async () => {
    renderFields();
    await fieldList();
    fireEvent.click(screen.getByRole('button', { name: 'Add field' }));
    const dialog = await screen.findByRole('dialog', { name: 'Add a field' });
    fireEvent.change(within(dialog).getByRole('textbox', { name: 'Label' }), {
      target: { value: 'Location' },
    });
    expect(
      within(dialog).getByText(
        'A field or fieldset with this short name already exists.',
      ),
    ).toBeInTheDocument();
  });

  it('adds a fieldset, and deletes an empty custom one', async () => {
    const driver = renderFields();
    await fieldList();
    fireEvent.click(screen.getByRole('button', { name: 'Add fieldset' }));
    const dialog = await screen.findByRole('dialog', {
      name: 'Add a fieldset',
    });
    fireEvent.change(within(dialog).getByRole('textbox', { name: 'Name' }), {
      target: { value: 'Speakers' },
    });
    await act(async () => {
      fireEvent.click(within(dialog).getByRole('button', { name: 'Add' }));
    });
    expect(await fieldList()).toHaveAccessibleName('Fields in Speakers');
    expect(screen.getByText('This fieldset has no fields yet.')).toBeVisible();

    const fieldsets = screen.getByRole('grid', { name: 'Fieldsets' });
    fireEvent.click(
      within(fieldsets).getByRole('row', { name: 'Registration' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Delete fieldset' }));
    await save();
    expect(
      (await driver.getSchema('Event')).fieldsets.map(
        (fieldset) => fieldset.id,
      ),
    ).toEqual(expect.arrayContaining(['default', 'speakers']));
    expect(
      (await driver.getSchema('Event')).fieldsets.map(
        (fieldset) => fieldset.id,
      ),
    ).not.toContain('registration');
  });
});

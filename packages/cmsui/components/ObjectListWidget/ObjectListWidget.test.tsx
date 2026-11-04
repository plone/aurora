import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAtomValue } from 'jotai';
import config from '@plone/registry';
import type { WidgetsConfig } from '@plone/types';
import { FormProvider, useFormStore, type FormApi } from '@plone/helpers';
import { TextWidget } from '../TextWidget/TextWidget';
import { BooleanWidget } from '../BooleanWidget/BooleanWidget';
import { buildSchemaValidators } from '../Form/validation';
import { ObjectListWidget } from './ObjectListWidget';
import type { ItemSchema, ObjectListItem } from './objectList';

// The texts are the translation keys: the tests run without translations.
const key = (name: string) => `cmsui.widgets.objectList.${name}`;

const itemSchema: ItemSchema = {
  title: 'Action',
  fieldsets: [
    { id: 'default', title: 'Default', fields: ['title', 'href', 'newTab'] },
  ],
  properties: {
    title: { title: 'Title' },
    href: { title: 'Target' },
    newTab: { title: 'Open in a new tab', type: 'boolean', default: false },
  },
  required: ['title'],
};

const actions: ObjectListItem[] = [
  { '@id': 'a', title: 'Sitemap', href: '/sitemap' },
  { '@id': 'b', title: 'Contact', href: '/contact' },
];

beforeAll(() => {
  // `ModalSheet` asks for the screen size.
  window.matchMedia ??= vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    onchange: null,
    dispatchEvent: vi.fn(),
  }));
});

beforeEach(() => {
  config.set('widgets', {} as WidgetsConfig);
  config.registerDefaultWidget(TextWidget);
  config.registerWidget({
    key: 'type',
    definition: { boolean: BooleanWidget },
  });
});

/** The widget as a field of a form, the way `SchemaField` renders it. */
let form!: FormApi<Record<string, unknown>>;

// The validators the form builds from a content type with the list.
const validators = buildSchemaValidators<Record<string, unknown>>(
  {
    properties: {
      actions: {
        title: 'Site actions',
        widget: 'object_list',
        schema: itemSchema,
      },
    },
  },
  { t: (key) => key },
);

function renderInForm(
  props: Partial<React.ComponentProps<typeof ObjectListWidget>> = {},
  initial: ObjectListItem[] = actions,
) {
  function Harness() {
    form = useFormStore<Record<string, unknown>>({
      key: 'test',
      initialValues: { actions: initial },
      validators,
    });
    return (
      <FormProvider form={form}>
        <Field {...props} />
      </FormProvider>
    );
  }
  function Field(fieldProps: typeof props) {
    const value = useValue(form);
    return (
      <ObjectListWidget
        name="actions"
        label="Site actions"
        value={value}
        onChange={(next) => form.setFieldValue('actions', next)}
        schema={{ title: 'Site actions', schema: itemSchema }}
        {...fieldProps}
      />
    );
  }
  render(<Harness />);
  return () => form.getValues().actions as ObjectListItem[];
}

// Re-renders with the form's value at `actions`.
function useValue(form: FormApi<Record<string, unknown>>) {
  return useAtomValue(form.fieldAtom('actions'), {
    store: form.store,
  }) as ObjectListItem[];
}

describe('ObjectListWidget, accordion layout', () => {
  it('shows a row for each item, closed', () => {
    renderInForm();
    expect(screen.getByRole('grid')).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(2);
    expect(screen.getByText('Sitemap')).toBeInTheDocument();
    expect(screen.getByText('/sitemap')).toBeInTheDocument();
    expect(screen.queryByLabelText('Title')).not.toBeInTheDocument();
  });

  it('edits an item in place, at its path in the form', () => {
    const values = renderInForm();
    fireEvent.click(screen.getByRole('button', { name: /^Contact/ }));
    const input = screen.getByRole('textbox', { name: 'Title' });
    expect(input).toHaveValue('Contact');
    fireEvent.change(input, { target: { value: 'Get in touch' } });
    expect(values()[1]).toEqual({
      '@id': 'b',
      title: 'Get in touch',
      href: '/contact',
    });
    // The row's title follows the field.
    expect(
      screen.getByRole('button', { name: /^Get in touch/ }),
    ).toBeInTheDocument();
  });

  it('adds an item with the defaults of its schema, and opens it', () => {
    const values = renderInForm();
    fireEvent.click(screen.getByRole('button', { name: key('add') }));
    const added = values()[2];
    expect(added['@id']).toBeTruthy();
    expect(added.newTab).toBe(false);
    expect(screen.getAllByRole('row')).toHaveLength(3);
    expect(screen.getByRole('textbox', { name: 'Title' })).toHaveValue('');
  });

  it('moves an item down with its menu', () => {
    const values = renderInForm();
    const [firstMenu] = screen.getAllByRole('button', { name: key('actions') });
    fireEvent.click(firstMenu);
    fireEvent.click(screen.getByRole('menuitem', { name: key('moveDown') }));
    expect(values().map((item) => item['@id'])).toEqual(['b', 'a']);
  });

  it('asks before removing an item', () => {
    const values = renderInForm();
    const [firstMenu] = screen.getAllByRole('button', { name: key('actions') });
    fireEvent.click(firstMenu);
    fireEvent.click(screen.getByRole('menuitem', { name: key('remove') }));
    const dialog = screen.getByRole('dialog');
    expect(values()).toHaveLength(2);
    fireEvent.click(
      within(dialog).getByRole('button', { name: key('remove') }),
    );
    expect(values().map((item) => item['@id'])).toEqual(['b']);
  });

  it('duplicates an item with an @id of its own', () => {
    const values = renderInForm();
    const [firstMenu] = screen.getAllByRole('button', { name: key('actions') });
    fireEvent.click(firstMenu);
    fireEvent.click(screen.getByRole('menuitem', { name: key('duplicate') }));
    const [first, copy] = values();
    expect(copy.title).toBe('Sitemap');
    expect(copy['@id']).not.toBe(first['@id']);
  });

  it('does not add more than maxItems', () => {
    renderInForm({ maxItems: 2 });
    expect(screen.getByRole('button', { name: key('add') })).toBeDisabled();
  });

  it('shows an empty state that adds the first item', () => {
    const values = renderInForm({}, []);
    expect(screen.getByText(key('empty'))).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: key('add') }));
    expect(values()).toHaveLength(1);
  });

  it('works outside a form, reporting changes with onChange', () => {
    const onChange = vi.fn();
    render(
      <ObjectListWidget
        name="actions"
        label="Site actions"
        value={actions}
        onChange={onChange}
        schema={itemSchema}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /^Sitemap/ }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Title' }), {
      target: { value: 'Map' },
    });
    expect(onChange).toHaveBeenLastCalledWith([
      { '@id': 'a', title: 'Map', href: '/sitemap' },
      actions[1],
    ]);
  });
});

describe('ObjectListWidget, validation', () => {
  const invalid: ObjectListItem[] = [
    { '@id': 'a', title: 'Sitemap', href: '/sitemap' },
    { '@id': 'b', title: '', href: '/contact' },
  ];

  it('opens the first item with errors when the form is submitted', async () => {
    renderInForm({}, invalid);
    expect(screen.queryByLabelText(/Title/)).not.toBeInTheDocument();

    let result: Awaited<ReturnType<typeof form.submit>> | undefined;
    await act(async () => {
      result = await form.submit();
    });

    expect(result).toEqual({
      ok: false,
      errors: { 'actions.1.title': ['cmsui.validation.required'] },
    });
    // The item is open, its field shows the error, and its row is marked.
    expect(screen.getByRole('textbox', { name: /Title/ })).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(screen.getByText('cmsui.validation.required')).toBeInTheDocument();
    expect(screen.getByText(key('invalid'))).toBeInTheDocument();
  });

  it('clears the error once the field is filled in', async () => {
    renderInForm({}, invalid);
    await act(async () => {
      await form.submit();
    });
    fireEvent.change(screen.getByRole('textbox', { name: /Title/ }), {
      target: { value: 'Contact' },
    });
    expect(screen.queryByText(key('invalid'))).not.toBeInTheDocument();
    expect(form.getErrors()).toEqual({});
  });

  it('marks the rows with errors in the table layout', async () => {
    renderInForm({ layout: 'table', columns: ['title', 'href'] }, invalid);
    await act(async () => {
      await form.submit();
    });
    const rows = screen.getAllByRole('row');
    expect(within(rows[2]).getByText(key('invalid'))).toBeInTheDocument();
    expect(within(rows[1]).queryByText(key('invalid'))).not.toBeInTheDocument();
  });
});

describe('ObjectListWidget, table layout', () => {
  it('shows the columns asked for', () => {
    renderInForm({ layout: 'table', columns: ['title', 'href'] });
    expect(screen.getByRole('grid')).toBeInTheDocument();
    expect(
      screen.getAllByRole('columnheader').map((cell) => cell.textContent),
    ).toEqual(expect.arrayContaining(['Title', 'Target']));
    expect(screen.getByRole('rowheader', { name: 'Sitemap' })).toBeTruthy();
  });

  it('edits an item in a dialog, and saves it on Save', async () => {
    const values = renderInForm({ layout: 'table', columns: ['title'] });
    fireEvent.click(screen.getAllByRole('button', { name: key('edit') })[1]);
    const dialog = screen.getByRole('dialog');
    fireEvent.change(within(dialog).getByRole('textbox', { name: 'Title' }), {
      target: { value: 'Get in touch' },
    });
    // Nothing changes until Save.
    expect(values()[1].title).toBe('Contact');
    await act(async () => {
      fireEvent.click(
        within(dialog).getByRole('button', { name: key('save') }),
      );
    });
    expect(values()[1].title).toBe('Get in touch');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('validates a new item before adding it', async () => {
    const values = renderInForm({ layout: 'table', columns: ['title'] });
    fireEvent.click(screen.getByRole('button', { name: key('add') }));
    const dialog = screen.getByRole('dialog');
    await act(async () => {
      fireEvent.click(
        within(dialog).getByRole('button', { name: key('addButton') }),
      );
    });
    // The title is required: the item is not added.
    expect(values()).toHaveLength(2);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.change(within(dialog).getByRole('textbox', { name: 'Title' }), {
      target: { value: 'Imprint' },
    });
    await act(async () => {
      fireEvent.click(
        within(dialog).getByRole('button', { name: key('addButton') }),
      );
    });
    expect(values()).toHaveLength(3);
    expect(values()[2].title).toBe('Imprint');
  });

  it('cancels the dialog without changing the list', () => {
    const values = renderInForm({ layout: 'table', columns: ['title'] });
    fireEvent.click(screen.getAllByRole('button', { name: key('edit') })[0]);
    const dialog = screen.getByRole('dialog');
    fireEvent.change(within(dialog).getByRole('textbox', { name: 'Title' }), {
      target: { value: 'Changed' },
    });
    fireEvent.click(
      within(dialog).getByRole('button', { name: key('cancel') }),
    );
    expect(values()[0].title).toBe('Sitemap');
  });
});

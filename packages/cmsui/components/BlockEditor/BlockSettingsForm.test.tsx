import { fireEvent, render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import config from '@plone/registry';
import type { FormWidgetProps } from '@plone/types';
import BlockSettingsForm from './BlockSettingsForm';

vi.mock('@plone/quanta', () => ({
  Accordion: ({ children }: any) => <section>{children}</section>,
  AccordionItem: ({ children }: any) => <div>{children}</div>,
  AccordionPanel: ({ children }: any) => <div>{children}</div>,
  AccordionItemTrigger: ({ children }: any) => <h3>{children}</h3>,
}));

// A minimal widget that follows the widget contract.
const InputWidget = ({
  label,
  value,
  onChange,
  required,
}: FormWidgetProps<string>) => (
  <label>
    {label}
    <input
      aria-label={label}
      data-required={required ? 'true' : 'false'}
      value={value ?? ''}
      onChange={(event) => onChange(event.target.value)}
    />
  </label>
);

beforeAll(() => {
  config.registerDefaultWidget(InputWidget);
});

const schema = {
  fieldsets: [
    {
      id: 'default',
      title: 'Default',
      fields: ['title', 'settings.caption', 'items.0.label'],
    },
  ],
  properties: {
    title: { title: 'Title' },
    'settings.caption': { title: 'Caption' },
    'items.0.label': { title: 'First item label' },
  },
  required: ['title'],
} as any;

const valueOf = (label: string) =>
  (screen.getByLabelText(label) as HTMLInputElement).value;

describe('BlockSettingsForm', () => {
  it('renders fieldsets and fields from a plain schema', () => {
    render(<BlockSettingsForm schema={schema} formData={{ title: 'Hello' }} />);

    expect(screen.getByText('Default')).toBeInTheDocument();
    expect(valueOf('Title')).toBe('Hello');
    expect(screen.getByLabelText('Caption')).toBeInTheDocument();
    expect(screen.getByLabelText('First item label')).toBeInTheDocument();
    expect(screen.getByLabelText('Title')).toHaveAttribute(
      'data-required',
      'true',
    );
    expect(screen.getByLabelText('Caption')).toHaveAttribute(
      'data-required',
      'false',
    );
  });

  it('supports function schemas and passes props/formData', () => {
    const schemaFactory = vi.fn(() => schema);
    const formData = { title: 'Factory title' };

    render(
      <BlockSettingsForm schema={schemaFactory as any} formData={formData} />,
    );

    expect(schemaFactory).toHaveBeenCalledWith(
      expect.objectContaining({
        formData,
        props: expect.objectContaining({ formData }),
        intl: undefined,
      }),
    );
  });

  it('calls onFormDataChange with top-level field updates', () => {
    const onFormDataChange = vi.fn();
    render(
      <BlockSettingsForm
        schema={schema}
        formData={{ title: 'Old title', untouched: 'keep-me' }}
        onFormDataChange={onFormDataChange}
      />,
    );

    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'New title' },
    });

    expect(onFormDataChange).toHaveBeenCalledWith({
      title: 'New title',
      untouched: 'keep-me',
    });
  });

  it('calls onFormDataChange with nested object path updates', () => {
    const onFormDataChange = vi.fn();
    render(
      <BlockSettingsForm
        schema={schema}
        formData={{
          title: 'A title',
          settings: { caption: 'Old caption', other: 'preserved' },
        }}
        onFormDataChange={onFormDataChange}
      />,
    );

    fireEvent.change(screen.getByLabelText('Caption'), {
      target: { value: 'New caption' },
    });

    expect(onFormDataChange).toHaveBeenCalledWith({
      title: 'A title',
      settings: { caption: 'New caption', other: 'preserved' },
    });
  });

  it('calls onFormDataChange with nested array path updates', () => {
    const onFormDataChange = vi.fn();
    render(
      <BlockSettingsForm
        schema={schema}
        formData={{ items: [{ label: 'Old item label', id: 'item-1' }] }}
        onFormDataChange={onFormDataChange}
      />,
    );

    fireEvent.change(screen.getByLabelText('First item label'), {
      target: { value: 'Updated item label' },
    });

    expect(onFormDataChange).toHaveBeenCalledWith({
      items: [{ label: 'Updated item label', id: 'item-1' }],
    });
  });

  it('writes a change and its side effects at once', () => {
    const onFormDataChange = vi.fn();
    const schemaWithSideEffects = {
      ...schema,
      properties: {
        ...schema.properties,
        title: {
          title: 'Title',
          onChangeSideEffects: (value: string) => ({
            'settings.caption': `Caption of ${value}`,
          }),
        },
      },
    };
    render(
      <BlockSettingsForm
        schema={schemaWithSideEffects}
        formData={{ title: 'Old' }}
        onFormDataChange={onFormDataChange}
      />,
    );

    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'New' },
    });

    expect(onFormDataChange).toHaveBeenCalledTimes(1);
    expect(onFormDataChange).toHaveBeenCalledWith({
      title: 'New',
      settings: { caption: 'Caption of New' },
    });
    expect(valueOf('Caption')).toBe('Caption of New');
  });

  it('starts over when the block data changes outside the form', () => {
    const { rerender } = render(
      <BlockSettingsForm schema={schema} formData={{ title: 'Initial' }} />,
    );

    rerender(
      <BlockSettingsForm schema={schema} formData={{ title: 'Undone' }} />,
    );

    expect(valueOf('Title')).toBe('Undone');
  });

  it('keeps the edits when the block data comes back from the editor', () => {
    let blockData: Record<string, unknown> = { title: 'Same value' };
    const onFormDataChange = vi.fn((next) => (blockData = next));
    const { rerender } = render(
      <BlockSettingsForm
        schema={schema}
        formData={blockData}
        onFormDataChange={onFormDataChange}
      />,
    );

    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'Typed' },
    });
    // Plate stores the change and passes the node data back as a new object.
    rerender(
      <BlockSettingsForm
        schema={schema}
        formData={{ ...blockData }}
        onFormDataChange={onFormDataChange}
      />,
    );

    expect(valueOf('Title')).toBe('Typed');
  });
});

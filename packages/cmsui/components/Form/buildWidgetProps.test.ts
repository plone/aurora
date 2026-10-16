import { describe, expect, it } from 'vitest';
import { buildWidgetProps } from './Field';

describe('buildWidgetProps', () => {
  it('builds the widget contract from the field schema and state', () => {
    const props = buildWidgetProps({
      name: 'exclude_from_nav',
      schema: {
        title: 'Exclude from navigation',
        description: 'Hide this item',
        type: 'boolean',
        default: false,
        readonly: true,
      },
      value: true,
      required: true,
      className: 'mb-4',
    });

    expect(props).toMatchObject({
      name: 'exclude_from_nav',
      value: true,
      defaultValue: false,
      label: 'Exclude from navigation',
      description: 'Hide this item',
      required: true,
      readOnly: true,
      invalid: false,
      errorMessage: undefined,
      className: 'mb-4',
    });
    expect(props).not.toHaveProperty('placeholder');
  });

  it('uses the schema default, not the current value, as the default value', () => {
    const props = buildWidgetProps({
      name: 'title',
      schema: { title: 'Title', default: 'Untitled' },
      value: 'My page',
    });

    expect(props.value).toBe('My page');
    expect(props.defaultValue).toBe('Untitled');
  });

  it('turns validation errors into invalid and one error message', () => {
    const props = buildWidgetProps({
      name: 'title',
      schema: { title: 'Title' },
      value: '',
      errors: ['Required', undefined, 'Too short'],
    });

    expect(props.invalid).toBe(true);
    expect(props.errorMessage).toBe('Required, Too short');
    expect(props).not.toHaveProperty('errors');
    expect(props).not.toHaveProperty('error');
  });

  it('does not pass the schema keys the form understands as widget props', () => {
    const props = buildWidgetProps({
      name: 'count',
      schema: {
        title: 'Count',
        type: 'integer',
        factory: 'Int',
        widget: 'number',
        minimum: 0,
      },
      value: 1,
    });

    expect(props).not.toHaveProperty('type');
    expect(props).not.toHaveProperty('factory');
    expect(props).not.toHaveProperty('widget');
    expect(props).not.toHaveProperty('minimum');
    expect(props).not.toHaveProperty('title');
    expect(props.schema).toMatchObject({ type: 'integer', minimum: 0 });
  });

  it('passes other schema keys to the widget as widget options', () => {
    const props = buildWidgetProps({
      name: 'href',
      schema: {
        title: 'Link',
        widget: 'object_browser',
        mode: 'link',
        selectedItemAttrs: ['Title'],
        allowExternals: true,
      },
      value: [],
    });

    expect(props).toMatchObject({
      mode: 'link',
      selectedItemAttrs: ['Title'],
      allowExternals: true,
    });
  });

  it('applies the widget props from the tagged values last', () => {
    const props = buildWidgetProps({
      name: 'text',
      schema: {
        title: 'Text',
        widgetOptions: {
          frontendOptions: {
            widget: 'special',
            widgetProps: { label: 'Overridden', rows: 4 },
          },
        },
      },
      value: '',
    });

    expect(props).toMatchObject({ label: 'Overridden', rows: 4 });
  });
});

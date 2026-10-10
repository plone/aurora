import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import config from '@plone/registry';
import type { WidgetsConfig } from '@plone/types';
import { useAppForm } from './Form';

const marker = (name: string) => {
  const Widget = () => <div data-testid="widget">{name}</div>;
  Widget.displayName = name;
  return Widget;
};

function TestForm({
  name,
  ...schema
}: { name: string } & Record<string, unknown>) {
  const form = useAppForm({
    defaultValues: { [name]: '' },
  });
  return (
    <form.AppField
      name={name}
      // eslint-disable-next-line react/no-children-prop
      children={(field: any) => (
        <field.SchemaField
          name={name}
          schema={schema}
          value={field.state.value}
        />
      )}
    />
  );
}

const renderedWidget = (
  fieldProps: { name: string } & Record<string, unknown>,
) => {
  render(<TestForm {...fieldProps} />);
  return screen.getByTestId('widget').textContent;
};

describe('Field widget resolution', () => {
  beforeEach(() => {
    config.set('widgets', {} as WidgetsConfig);
    config.registerDefaultWidget(marker('default'));
    config.registerWidget({
      key: 'id',
      definition: { subjects: marker('id') },
    });
    config.registerWidget({
      key: 'widget',
      definition: { image: marker('widget:image'), named: marker('widget') },
    });
    config.registerWidget({
      key: 'factory',
      definition: { 'Relation List': marker('factory') },
    });
    config.registerWidget({
      key: 'vocabulary',
      definition: { 'plone.app.vocabularies.Catalog': marker('vocabulary') },
    });
    config.registerWidget({
      key: 'type',
      definition: { boolean: marker('type') },
    });
  });

  it('resolves by field id first', () => {
    expect(renderedWidget({ name: 'subjects', widget: 'named' })).toBe('id');
  });

  it('resolves by widget name', () => {
    expect(renderedWidget({ name: 'field', widget: 'named' })).toBe('widget');
  });

  it('resolves by the widget in the tagged values', () => {
    expect(
      renderedWidget({
        name: 'field',
        widgetOptions: { frontendOptions: { widget: 'named' } },
      }),
    ).toBe('widget');
  });

  it('continues the lookup when the widget name is unknown', () => {
    expect(
      renderedWidget({
        name: 'field',
        widget: 'unknown',
        factory: 'Relation List',
      }),
    ).toBe('factory');
  });

  it('resolves by vocabulary', () => {
    expect(
      renderedWidget({
        name: 'field',
        widgetOptions: {
          vocabulary: {
            '@id':
              'http://localhost/@vocabularies/plone.app.vocabularies.Catalog',
          },
        },
      }),
    ).toBe('vocabulary');
  });

  it('resolves by type', () => {
    expect(renderedWidget({ name: 'field', type: 'boolean' })).toBe('type');
  });

  it('does not match a widget of another category by field name', () => {
    // A field named `image` must not get the `image` widget.
    expect(renderedWidget({ name: 'image', type: 'object' })).toBe('default');
  });

  it('falls back to the default widget', () => {
    expect(renderedWidget({ name: 'field', type: 'string' })).toBe('default');
  });
});

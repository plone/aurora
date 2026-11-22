import { describe, expect, it } from 'vitest';
import config from '@plone/registry';
import {
  cellText,
  dropIndex,
  itemKeys,
  moveItem,
  newItem,
  resolveItemSchema,
  summaryOf,
  titleOf,
  withItemIds,
  type ItemSchema,
} from './objectList';

const schema: ItemSchema = {
  title: 'Link',
  fieldsets: [{ id: 'default', title: 'Default', fields: ['network', 'href'] }],
  properties: {
    network: {
      title: 'Network',
      choices: [
        ['mastodon', 'Mastodon'],
        ['github', 'GitHub'],
      ],
    },
    href: { title: 'Link' },
    newTab: { title: 'Open in a new tab', type: 'boolean', default: false },
  },
  required: ['network'],
};

describe('resolveItemSchema', () => {
  it('reads the item schema from the field schema, as in a block schema', () => {
    expect(resolveItemSchema({ schema: { title: 'Links', schema } })).toBe(
      schema,
    );
  });

  it('reads the item schema itself, as widget props from the tagged values', () => {
    expect(resolveItemSchema({ schema })).toBe(schema);
  });

  it('calls a schema function with the widget props', () => {
    const props = { schema: () => schema, label: 'Links' };
    expect(resolveItemSchema(props)).toBe(schema);
  });

  it('prefers a registered schema utility', () => {
    config.registerUtility({
      type: 'schema',
      name: 'testLinks',
      method: () => schema,
    });
    expect(
      resolveItemSchema({ schemaName: 'testLinks', schema: { title: 'x' } }),
    ).toBe(schema);
  });

  it('falls back to a schema with no fields', () => {
    expect(
      resolveItemSchema({ schema: { title: 'Links' } }).properties,
    ).toEqual({});
  });
});

describe('item keys', () => {
  it('keys items by @id, and by position when it is missing or repeated', () => {
    expect(
      itemKeys([{ '@id': 'a' }, {}, { '@id': 'a' }, { '@id': 'b' }]),
    ).toEqual(['a', '#1', '#2', 'b']);
  });

  it('gives an @id to the items without a unique one', () => {
    const items = withItemIds([{ '@id': 'a' }, { title: 'x' }, { '@id': 'a' }]);
    expect(items[0]).toEqual({ '@id': 'a' });
    expect(items[1]['@id']).toMatch(/^[0-9a-f-]{36}$/);
    expect(items[1].title).toBe('x');
    expect(items[2]['@id']).not.toBe('a');
  });
});

describe('moving items', () => {
  it('moves an item', () => {
    expect(moveItem(['a', 'b', 'c'], 0, 2)).toEqual(['b', 'c', 'a']);
    expect(moveItem(['a', 'b', 'c'], 2, 0)).toEqual(['c', 'a', 'b']);
  });

  it('finds where a dropped item lands', () => {
    // Dropping the first of three after the last: it becomes the last.
    expect(dropIndex(0, 2, 'after')).toBe(2);
    // Dropping the last before the first.
    expect(dropIndex(2, 0, 'before')).toBe(0);
    // Dropping the first before the third: it lands in the middle.
    expect(dropIndex(0, 2, 'before')).toBe(1);
  });
});

describe('newItem', () => {
  it('starts from the defaults of the schema, with an @id', () => {
    const item = newItem(schema);
    expect(item.newTab).toBe(false);
    expect(item['@id']).toBeTruthy();
  });
});

describe('item texts', () => {
  it('shows the label of a choice, a list, and an object by its title', () => {
    expect(cellText(schema.properties.network, 'github')).toBe('GitHub');
    expect(cellText({}, [{ title: 'Home' }, { '@id': '/news' }])).toBe(
      'Home, /news',
    );
    expect(cellText({}, null)).toBe('');
  });

  it('names an item by its title, else by its first field', () => {
    expect(titleOf({ title: 'Plone' }, 0, schema)).toBe('Plone');
    expect(titleOf({ network: 'mastodon' }, 0, schema)).toBe('Mastodon');
    expect(titleOf({ href: 'x' }, 0, schema, 'network')).toBe('');
    expect(titleOf({}, 1, schema, (_item, index) => `#${index}`)).toBe('#1');
  });

  it('summarizes an item by the first other field with a value', () => {
    const item = { network: 'mastodon', href: 'https://fosstodon.org' };
    expect(summaryOf(item, schema, 'Mastodon')).toBe('https://fosstodon.org');
  });
});

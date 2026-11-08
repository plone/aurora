import type { BlockViewProps } from '@plone/types';

type Item = { '@id'?: string; title?: string; href?: string };

/** Lists the titles of the block's items, so tests can see the data. */
export default function ObjectListTestView({ data }: BlockViewProps) {
  const lists = data as { actions?: Item[]; links?: Item[] };
  return (
    <div className="object-list-test block">
      <p>Object list test</p>
      {(['actions', 'links'] as const).map((field) => (
        <ul key={field} data-field={field}>
          {(lists[field] ?? []).map((item, index) => (
            <li key={item['@id'] ?? index}>{item.title || item.href}</li>
          ))}
        </ul>
      ))}
    </div>
  );
}

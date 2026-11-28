/** A collapsible JSON tree with colors per type. */
import { useState } from 'react';

function special(v: unknown): string | undefined {
  if (typeof v === 'function') return '[Function]';
  if (v instanceof Promise) return '[Promise (deferred)]';
  if (typeof v === 'bigint') return `${v}n`;
  if (typeof v === 'undefined') return 'undefined';
  return undefined;
}

function normalize(v: unknown): unknown {
  if (v instanceof Map) return Object.fromEntries(v);
  if (v instanceof Set) return [...v];
  return v;
}

function Leaf({ value }: { value: unknown }) {
  const sp = special(value);
  if (sp) return <span className="z">{sp}</span>;
  if (value === null) return <span className="z">null</span>;
  if (typeof value === 'string')
    return <span className="s">{`"${value}"`}</span>;
  if (typeof value === 'number') return <span className="n">{value}</span>;
  if (typeof value === 'boolean')
    return <span className="b">{String(value)}</span>;
  return <span>{String(value)}</span>;
}

/** The first keys of a collapsed object, or the length of an array. */
function preview(
  isArr: boolean,
  entries: readonly (readonly [string, unknown])[],
) {
  if (isArr) return '…';
  const keys = entries.slice(0, 4).map(([k]) => k);
  return `${keys.join(', ')}${entries.length > keys.length ? ', …' : ''}`;
}

function Node({
  name,
  value,
  depth,
  defaultOpenDepth,
  ancestors,
}: {
  name?: string;
  value: unknown;
  depth: number;
  defaultOpenDepth: number;
  ancestors: readonly object[];
}) {
  const v = normalize(value);
  const isObj = v !== null && typeof v === 'object' && !special(v);
  const [open, setOpen] = useState(depth < defaultOpenDepth);
  const key =
    name !== undefined ? (
      <>
        <span className="k">{name}</span>:{' '}
      </>
    ) : null;
  if (!isObj) {
    return (
      <div className="row">
        {key}
        <Leaf value={v} />
      </div>
    );
  }
  if (ancestors.includes(v as object)) {
    return (
      <div className="row">
        {key}
        <span className="z">[Circular]</span>
      </div>
    );
  }
  const isArr = Array.isArray(v);
  const entries = isArr
    ? (v as unknown[]).map((x, i) => [String(i), x] as const)
    : Object.entries(v as Record<string, unknown>);
  const [o, c] = isArr ? ['[', ']'] : ['{', '}'];
  const chain = [...ancestors, v as object];
  return (
    <div className="row">
      <button
        className="toggle"
        onClick={() => setOpen(!open)}
        aria-label={open ? 'Collapse' : 'Expand'}
      >
        {open ? '▾' : '▸'}
      </button>
      {key}
      {open ? (
        <>
          {o}
          <span className="meta">
            {entries.length} {entries.length === 1 ? 'item' : 'items'}
          </span>
          <div className="nest">
            {entries.map(([k, x]) => (
              <Node
                key={k}
                name={isArr ? undefined : k}
                value={x}
                depth={depth + 1}
                defaultOpenDepth={defaultOpenDepth}
                ancestors={chain}
              />
            ))}
          </div>
          {c}
        </>
      ) : (
        <button className="collapsed" onClick={() => setOpen(true)}>
          {o}
          {entries.length > 0 && (
            <span className="preview">{preview(isArr, entries)}</span>
          )}
          {c}
          <span className="meta">
            {entries.length} {entries.length === 1 ? 'item' : 'items'}
          </span>
        </button>
      )}
    </div>
  );
}

export function JsonTree({
  value,
  defaultOpenDepth = 1,
}: {
  value: unknown;
  defaultOpenDepth?: number;
}) {
  return (
    <div className="pdt-json">
      <Node
        value={value}
        depth={0}
        defaultOpenDepth={defaultOpenDepth}
        ancestors={[]}
      />
    </div>
  );
}

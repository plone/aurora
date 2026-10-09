// Depth limit for `Path`, so recursive types (like content with blocks)
// do not make TypeScript give up.
type Prev = [never, 0, 1, 2, 3, 4, 5];

/**
 * The dotted paths of an object type, for example `'title'`,
 * `'settings.caption'` or `'items.0.label'`.
 *
 * Types with an index signature accept any string as a path.
 */
export type Path<T, Depth extends number = 5> = [Depth] extends [never]
  ? string
  : T extends ReadonlyArray<infer Item>
    ? `${number}` | `${number}.${Path<Item, Prev[Depth]>}`
    : T extends object
      ? string extends keyof T
        ? string
        : {
            [K in keyof T & string]: T[K] extends object | undefined
              ? K | `${K}.${Path<NonNullable<T[K]>, Prev[Depth]>}`
              : K;
          }[keyof T & string]
      : never;

/** The type of the value at a dotted path of an object type. */
export type PathValue<
  T,
  P extends string,
> = P extends `${infer Key}.${infer Rest}`
  ? Key extends keyof NonNullable<T>
    ? PathValue<NonNullable<T>[Key], Rest>
    : NonNullable<T> extends ReadonlyArray<infer Item>
      ? PathValue<Item, Rest>
      : unknown
  : P extends keyof NonNullable<T>
    ? NonNullable<T>[P]
    : NonNullable<T> extends ReadonlyArray<infer Item>
      ? Item
      : unknown;

const isIndex = (segment: string) => /^\d+$/.test(segment);

/** Reads the value at a dotted path. Returns `undefined` for missing parts. */
export function getByPath(source: unknown, path: string): unknown {
  let current: unknown = source;
  for (const segment of path.split('.')) {
    if (current === null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
}

/**
 * Returns a copy of `source` with `value` at a dotted path.
 *
 * Only the objects and arrays along the path are copied; everything else is
 * shared with `source`. Missing parts are created: an array when the next
 * segment is an index, an object otherwise.
 */
export function setByPath<T>(source: T, path: string, value: unknown): T {
  const segments = path.split('.');
  const copy = (node: unknown, nextSegment: string) => {
    if (Array.isArray(node)) return [...node];
    if (node !== null && typeof node === 'object') return { ...node };
    return isIndex(nextSegment) ? [] : {};
  };

  const root = copy(source, segments[0]) as Record<string, unknown>;
  let current = root;
  for (let index = 0; index < segments.length - 1; index += 1) {
    const segment = segments[index];
    const next = copy(current[segment], segments[index + 1]);
    current[segment] = next;
    current = next as Record<string, unknown>;
  }
  current[segments[segments.length - 1]] = value;

  return root as T;
}

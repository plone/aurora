export interface TaggedItem {
  '@id': string;
  // Brains expose keywords as `Subject`, content as `subjects`; read either.
  Subject?: string[] | null;
  subjects?: string[] | null;
}

export interface TagsItemPayload {
  '@id': string;
  title: string;
  data: { subjects: string[] };
}

export function itemSubjects(item: TaggedItem): string[] {
  return item.Subject ?? item.subjects ?? [];
}

export function unionSubjects(items: TaggedItem[]): string[] {
  const all = new Set<string>();
  items.forEach((item) => itemSubjects(item).forEach((s) => all.add(s)));
  return [...all].sort((a, b) => a.localeCompare(b));
}

export function applyTagChanges(
  current: string[] | null | undefined,
  added: string[],
  removed: string[],
): string[] {
  const next = new Set(current ?? []);
  removed.forEach((tag) => next.delete(tag));
  added.forEach((tag) => next.add(tag));
  return [...next];
}

export function buildTagsPayload(
  items: Array<TaggedItem & { title?: string }>,
  added: string[],
  removed: string[],
): TagsItemPayload[] {
  return items
    .map((item) => {
      const current = itemSubjects(item);
      const subjects = applyTagChanges(current, added, removed);
      return {
        '@id': item['@id'],
        title: item.title ?? item['@id'],
        data: { subjects },
        changed: !sameSet(current, subjects),
      };
    })
    .filter((p) => p.changed)
    .map(({ changed, ...payload }) => payload);
}

function sameSet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const setB = new Set(b);
  return a.every((x) => setB.has(x));
}

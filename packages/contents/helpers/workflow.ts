export interface Transition {
  '@id': string;
  title: string;
}

export interface TransitionOption {
  id: string;
  title: string;
}

export function transitionId(transition: Transition): string {
  return transition['@id'].split('/').pop() || transition['@id'];
}

export function commonTransitions(perItem: Transition[][]): TransitionOption[] {
  if (perItem.length === 0) return [];

  const maps = perItem.map(
    (transitions) =>
      new Map(transitions.map((t) => [transitionId(t), t.title])),
  );
  const [first, ...rest] = maps;

  const result: TransitionOption[] = [];
  for (const [id, title] of first) {
    if (rest.every((m) => m.has(id))) {
      result.push({ id, title });
    }
  }
  return result;
}

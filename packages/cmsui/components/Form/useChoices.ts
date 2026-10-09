import { useEffect, useMemo, useState } from 'react';
import type { WidgetChoice, WidgetVocabulary } from '@plone/types';

/** One option of a field with choices or a vocabulary. */
export type ChoiceOption = { value: string; label: string };

/**
 * A term as the content API sends it: its token, or an object with its token
 * and its title, such as `{ "token": "Document", "title": "Page" }`.
 */
export type TermValue = string | { token: string; title?: string | null };

/** The option of a term the content API sent. */
export const termOption = (term: unknown): ChoiceOption | null => {
  if (term == null || term === '') return null;
  if (typeof term === 'object' && 'token' in term) {
    const { token, title } = term as { token: unknown; title?: unknown };
    return { value: String(token), label: String(title ?? token) };
  }
  return { value: String(term), label: String(term) };
};

// The same empty list on every render, while a vocabulary loads.
const NO_OPTIONS: ChoiceOption[] = [];

/**
 * The name of a vocabulary, from its `@id`
 * (`http://site/@vocabularies/plone.app.vocabularies.Keywords`).
 */
export const vocabularyName = (vocabulary?: WidgetVocabulary) => {
  const id = vocabulary?.['@id'];
  if (!id || !id.includes('/@vocabularies/')) return undefined;
  return id.slice(id.lastIndexOf('/@vocabularies/') + '/@vocabularies/'.length);
};

/**
 * The options of a field: its `choices`, or the terms of its vocabulary.
 *
 * Fields with choices have their options in the schema. For a vocabulary,
 * the terms are loaded from the `@vocabulary` resource route; with `title`,
 * only the terms whose title matches it.
 */
export function useChoices({
  choices,
  vocabulary,
  title,
}: {
  choices?: WidgetChoice[];
  vocabulary?: WidgetVocabulary;
  title?: string;
}): { options: ChoiceOption[]; loading: boolean } {
  const name = choices ? undefined : vocabularyName(vocabulary);
  const query = name
    ? new URLSearchParams({ name, ...(title ? { title } : {}) }).toString()
    : '';
  const [loaded, setLoaded] = useState<{
    query: string;
    options: ChoiceOption[];
  } | null>(null);

  useEffect(() => {
    if (!query) return;
    const controller = new AbortController();
    fetch(`/@vocabulary?${query}`, {
      credentials: 'include',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : { items: [] }))
      .then((data: { items?: Array<{ token: string; title: string }> }) =>
        setLoaded({
          query,
          options: (data.items ?? []).map(({ token, title }) => ({
            value: token,
            label: title,
          })),
        }),
      )
      .catch(() => {
        // An aborted or failed request leaves the options as they are.
      });
    return () => controller.abort();
  }, [query]);

  const fromChoices = useMemo(
    () => (choices ?? []).map(([value, label]) => ({ value, label })),
    [choices],
  );

  if (!query) return { options: fromChoices, loading: false };
  if (loaded?.query === query)
    return { options: loaded.options, loading: false };
  return { options: loaded?.options ?? NO_OPTIONS, loading: true };
}

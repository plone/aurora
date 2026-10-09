import {
  data,
  RouterContextProvider,
  type LoaderFunctionArgs,
} from 'react-router';
import { ploneClientContext } from '@plone/aurora/app/middleware.server';

export type VocabularyTerm = { token: string; title: string };

/**
 * The terms of a vocabulary, for the widgets of fields with a vocabulary.
 *
 * `/@vocabulary?name=plone.app.vocabularies.Keywords&title=news` returns
 * `{ items: [{ token, title }] }`: all the terms, or the ones whose title
 * matches `title`.
 */
export async function loader({
  request,
  context,
}: LoaderFunctionArgs<RouterContextProvider>) {
  const cli = context.get(ploneClientContext);
  const searchParams = new URL(request.url).searchParams;
  const name = searchParams.get('name');
  const title = searchParams.get('title') || undefined;

  let items: VocabularyTerm[] = [];
  if (name) {
    try {
      const { data: vocabulary } = await cli.getVocabulary({
        path: name,
        title,
        b_size: -1,
      });
      items = (vocabulary.items ?? []).map(({ token, title }) => ({
        token,
        title: title ?? token,
      }));
    } catch (error) {
      // A vocabulary the editor can't read, or that doesn't exist, has no
      // terms, instead of the error page replacing the form.
      const status = (error as { status?: number })?.status;
      if (!status || status >= 500) throw error;
    }
  }

  return data(
    { items },
    {
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );
}

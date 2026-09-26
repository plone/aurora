import {
  data,
  RouterContextProvider,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from 'react-router';
import { requireAuthCookie } from '@plone/react-router';
import { ploneClientContext } from '@plone/aurora/app/middleware.server';
import { HandleCatchedError } from '../helpers/Errors';
import { settleItems } from '../helpers/batch';
import type { TagsItemPayload } from '../helpers/tags';

export async function loader({
  request,
  context,
}: LoaderFunctionArgs<RouterContextProvider>) {
  await requireAuthCookie(request);
  const cli = context.get(ploneClientContext);

  let vocabulary: string[] = [];
  try {
    const result = await cli.getVocabulary({
      path: 'plone.app.vocabularies.Keywords',
    });
    vocabulary = result.data.items.map((item) => item.token);
  } catch (e) {
    HandleCatchedError(e, 'Error loading keywords vocabulary');
  }

  return data({ vocabulary }, 200);
}

export async function action({
  request,
  context,
}: ActionFunctionArgs<RouterContextProvider>) {
  await requireAuthCookie(request);
  const cli = context.get(ploneClientContext);
  const payload: { items: TagsItemPayload[] } = await request.json();

  const { ok, errors } = await settleItems(
    payload.items,
    (item) => cli.updateContent({ path: item['@id'], data: item.data }),
    'Error on tags update',
  );

  return data({ ok, errors }, 200);
}

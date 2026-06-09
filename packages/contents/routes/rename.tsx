import {
  data,
  RouterContextProvider,
  type ActionFunctionArgs,
} from 'react-router';
import { requireAuthCookie } from '@plone/react-router';
import { ploneClientContext } from '@plone/aurora/app/middleware.server';
import { settleItems } from '../helpers/batch';
import type { RenameItemPayload } from '../helpers/rename';

export async function action({
  request,
  context,
}: ActionFunctionArgs<RouterContextProvider>) {
  await requireAuthCookie(request);

  const cli = context.get(ploneClientContext);
  const payload: { items: RenameItemPayload[] } = await request.json();

  const { ok, errors } = await settleItems(
    payload.items,
    (item) => cli.updateContent({ path: item['@id'], data: item.data }),
    'Error on rename',
  );

  return data({ ok, errors }, 200);
}

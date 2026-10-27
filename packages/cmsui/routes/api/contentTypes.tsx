import {
  data,
  RouterContextProvider,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from 'react-router';
import { ploneClientContext } from '@plone/aurora/app/middleware.server';
import { requireAuthCookie } from '@plone/react-router';
import type { NewContentType } from '@plone/controlpanels';
import {
  type DexterityTypesItem,
  errorMessage,
  toContentTypeSummary,
} from '../../helpers/contentTypes';

const json = (body: unknown, status = 200) =>
  data(body, { status, headers: { 'Content-Type': 'application/json' } });

const failure = (error: unknown, fallback: string) =>
  json(
    { message: errorMessage(error, fallback) },
    Number((error as { status?: number })?.status) || 500,
  );

/**
 * The content types control panel's data, for the Aurora driver.
 *
 * `GET /@content-types` lists the types. Until plone.restapi has
 * `@content-types` (plone/plone.restapi#2061), this reads and writes
 * `@controlpanels/dexterity-types` and translates its payloads.
 */
export async function loader({
  params,
  request,
  context,
}: LoaderFunctionArgs<RouterContextProvider>) {
  await requireAuthCookie(request);
  if (params['*']) return json({ message: 'Not found' }, 404);

  const cli = context.get(ploneClientContext);
  try {
    const { data: listing } = await cli.getControlpanel({
      id: 'dexterity-types',
    });
    const items = (listing.items ?? []) as unknown as DexterityTypesItem[];
    return json({ items: items.map(toContentTypeSummary) });
  } catch (error) {
    return failure(error, "The content types couldn't be loaded");
  }
}

/**
 * `POST /@content-types` creates a type from `{ title, id?, description? }`.
 * `DELETE /@content-types/{type}` deletes one.
 */
export async function action({
  params,
  request,
  context,
}: ActionFunctionArgs<RouterContextProvider>) {
  await requireAuthCookie(request);
  const cli = context.get(ploneClientContext);
  const type = params['*'] ?? '';

  if (request.method === 'POST' && !type) {
    const body = (await request.json()) as NewContentType;
    if (!body?.title) return json({ message: 'A title is required' }, 400);
    if (body.copyFrom) {
      return json({ message: 'Copying types is not supported yet' }, 501);
    }
    try {
      const { data: created } = await cli.createControlpanel({
        path: 'dexterity-types',
        data: {
          title: body.title,
          id: body.id,
          description: body.description,
        },
      });
      return json(
        toContentTypeSummary({
          '@id': created['@id'],
          id: body.id ?? String(created['@id']).split('/').pop() ?? '',
          title: created.title ?? body.title,
          description: created.description,
          count: 0,
        }),
        201,
      );
    } catch (error) {
      return failure(error, "The type couldn't be created");
    }
  }

  if (request.method === 'DELETE' && type) {
    try {
      await cli.deleteControlpanel({ path: `dexterity-types/${type}` });
      return json({ id: type });
    } catch (error) {
      return failure(error, "The type couldn't be deleted");
    }
  }

  return json({ message: 'Method not allowed' }, 405);
}

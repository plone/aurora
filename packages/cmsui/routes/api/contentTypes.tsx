import {
  data,
  RouterContextProvider,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from 'react-router';
import { ploneClientContext } from '@plone/aurora/app/middleware.server';
import { requireAuthCookie } from '@plone/react-router';
import type {
  ContentTypeChanges,
  NewContentType,
  TypeSchema,
} from '@plone/controlpanels';
import {
  type DexterityTypeResponse,
  type DexterityTypesItem,
  errorMessage,
  toContentTypeSettings,
  toBehaviors,
  toContentTypeSummary,
  toDexterityTypePatch,
  toFieldTypes,
  toTypeSchemaPut,
} from '../../helpers/contentTypes';

const json = (body: unknown, status = 200) =>
  data(body, { status, headers: { 'Content-Type': 'application/json' } });

const failure = (error: unknown, fallback: string) =>
  json(
    { message: errorMessage(error, fallback) },
    Number((error as { status?: number })?.status) || 500,
  );

/** The parts of the splat: `{type}`, `{type}/schema` or `@field-types`. */
const parse = (splat: string | undefined) => {
  const [type = '', part = ''] = (splat ?? '').split('/');
  return { type, part };
};

/**
 * The content types control panel's data, for the Aurora driver.
 *
 * `GET /@content-types` lists the types, `GET /@content-types/{type}` returns
 * one type's settings and `GET /@content-types/{type}/schema` its schema.
 * `GET /@content-types/@field-types` lists the kinds of fields (type names
 * can't start with `@`). Until plone.restapi has `@content-types`
 * (plone/plone.restapi#2061), this reads and writes
 * `@controlpanels/dexterity-types` and `@types`, and translates their
 * payloads.
 */
export async function loader({
  params,
  request,
  context,
}: LoaderFunctionArgs<RouterContextProvider>) {
  await requireAuthCookie(request);
  const cli = context.get(ploneClientContext);
  const { type, part } = parse(params['*']);

  if (type === '@field-types') {
    try {
      const { data: vocabulary } = await cli.getVocabulary({
        path: 'Fields',
        // Plone has about 20 kinds of fields.
        b_size: 100,
      });
      return json(toFieldTypes(vocabulary.items ?? []));
    } catch (error) {
      return failure(error, "The field types couldn't be loaded");
    }
  }

  if (type === '@behaviors') {
    try {
      // Every type's overview form lists every behavior of the site.
      const { data: listing } = await cli.getControlpanel({
        id: 'dexterity-types',
      });
      const [first] = (listing.items ?? []) as unknown as DexterityTypesItem[];
      if (!first) return json([]);
      const { data: response } = await cli.getControlpanel({
        id: `dexterity-types/${first.id}`,
      });
      return json(toBehaviors(response as unknown as DexterityTypeResponse));
    } catch (error) {
      return failure(error, "The behaviors couldn't be loaded");
    }
  }

  if (type && part === 'schema') {
    try {
      const { data: schema } = await cli.getType({ type });
      return json(schema);
    } catch (error) {
      return failure(error, "The fields couldn't be loaded");
    }
  }

  if (type) {
    try {
      const { data: response } = await cli.getControlpanel({
        id: `dexterity-types/${type}`,
      });
      return json(
        toContentTypeSettings(
          type,
          response as unknown as DexterityTypeResponse,
        ),
      );
    } catch (error) {
      return failure(error, "The type couldn't be loaded");
    }
  }

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
 * `PUT /@content-types/{type}/schema` replaces the type's own fields and
 * fieldsets.
 * `PATCH /@content-types/{type}` changes its settings, and
 * `DELETE /@content-types/{type}` deletes it.
 */
export async function action({
  params,
  request,
  context,
}: ActionFunctionArgs<RouterContextProvider>) {
  await requireAuthCookie(request);
  const cli = context.get(ploneClientContext);
  const { type, part } = parse(params['*']);

  if (request.method === 'PUT' && type && part === 'schema') {
    const schema = (await request.json()) as TypeSchema;
    try {
      await cli.updateTypeSchema({ type, data: toTypeSchemaPut(schema) });
      return json({ id: type });
    } catch (error) {
      return failure(error, "The fields couldn't be saved");
    }
  }

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

  if (request.method === 'PATCH' && type) {
    const changes = (await request.json()) as ContentTypeChanges;
    try {
      let behaviors: string[] = [];
      if (changes.behaviors) {
        const { data: current } = await cli.getControlpanel({
          id: `dexterity-types/${type}`,
        });
        behaviors = toBehaviors(
          current as unknown as DexterityTypeResponse,
        ).map((behavior) => behavior.name);
      }
      const patch = toDexterityTypePatch(changes, behaviors);
      if (!Object.keys(patch).length) {
        return json({ message: 'Nothing to change that can be saved' }, 400);
      }
      await cli.updateControlpanel({
        path: `dexterity-types/${type}`,
        data: patch,
      });
      return json({ id: type });
    } catch (error) {
      return failure(error, "The type couldn't be saved");
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

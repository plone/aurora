import {
  data,
  RouterContextProvider,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from 'react-router';
import { ploneClientContext } from '@plone/aurora/app/middleware.server';
import { requireAuthCookie } from '@plone/react-router';
import {
  errorMessage,
  type ContentTypeChanges,
  type NewContentType,
  type TypeSchema,
  type WorkflowChangeRequest,
} from '@plone/controlpanels';
import { contentTypesDriver } from '../../helpers/contentTypesBackend';

const json = (body: unknown, status = 200) =>
  data(body ?? null, {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

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
 * The content types control panel's data, for the Aurora driver. Each route
 * calls a method of `@plone/controlpanels`' plone.restapi driver on the
 * server, which uses `@content-types`, `@behaviors` and `@workflows`
 * (plone/plone.restapi#2061) when the backend has them.
 *
 * - `GET /@content-types`: the types (`listTypes`)
 * - `GET /@content-types/{type}`: a type's settings (`getType`)
 * - `GET /@content-types/{type}/schema`: its schema (`getSchema`), or with
 *   `?behaviors=` the schema it would have with them (`previewSchema`)
 * - `GET /@content-types/@field-types`, `@behaviors`, `@workflows` and
 *   `@workflow-assignments` (type names can't start with `@`)
 */
export async function loader({
  params,
  request,
  context,
}: LoaderFunctionArgs<RouterContextProvider>) {
  await requireAuthCookie(request);
  const driver = await contentTypesDriver(context.get(ploneClientContext));
  const { type, part } = parse(params['*']);

  try {
    if (type === '@field-types') return json(await driver.listFieldTypes());
    if (type === '@behaviors') return json(await driver.listBehaviors());
    if (type === '@workflows') {
      return json(driver.listWorkflows ? await driver.listWorkflows() : []);
    }
    if (type === '@workflow-assignments' && driver.getWorkflowAssignments) {
      return json(await driver.getWorkflowAssignments());
    }
    if (type && part === 'schema') {
      const behaviors = new URL(request.url).searchParams.get('behaviors');
      return json(
        behaviors !== null && driver.previewSchema
          ? await driver.previewSchema(
              type,
              behaviors.split(',').filter(Boolean),
            )
          : await driver.getSchema(type),
      );
    }
    if (type) return json(await driver.getType(type));
    return json({ items: await driver.listTypes() });
  } catch (error) {
    return failure(error, "The content types couldn't be loaded");
  }
}

/**
 * - `POST /@content-types`: creates a type (`createType`)
 * - `PATCH /@content-types/{type}`: changes its settings (`updateType`)
 * - `PUT /@content-types/{type}/schema`: replaces its own fields and fieldsets
 *   (`saveSchema`)
 * - `DELETE /@content-types/{type}`: deletes it (`deleteType`)
 * - `POST /@content-types/@workflow-changes`: changes workflows
 *   (`changeWorkflow`), or with `?preview` says what that would do
 *   (`previewWorkflowChange`)
 */
export async function action({
  params,
  request,
  context,
}: ActionFunctionArgs<RouterContextProvider>) {
  await requireAuthCookie(request);
  const driver = await contentTypesDriver(context.get(ploneClientContext));
  const { type, part } = parse(params['*']);

  try {
    if (request.method === 'POST' && type === '@workflow-changes') {
      const change = (await request.json()) as WorkflowChangeRequest;
      const preview = new URL(request.url).searchParams.has('preview');
      if (preview && driver.previewWorkflowChange) {
        return json(await driver.previewWorkflowChange(change));
      }
      if (!preview && driver.changeWorkflow) {
        return json(await driver.changeWorkflow(change));
      }
    }
    if (request.method === 'PUT' && type && part === 'schema') {
      await driver.saveSchema(type, (await request.json()) as TypeSchema);
      return json({ id: type });
    }
    if (request.method === 'POST' && !type) {
      const body = (await request.json()) as NewContentType;
      if (!body?.title) return json({ message: 'A title is required' }, 400);
      return json(await driver.createType(body), 201);
    }
    if (request.method === 'PATCH' && type) {
      await driver.updateType(
        type,
        (await request.json()) as ContentTypeChanges,
      );
      return json({ id: type });
    }
    if (request.method === 'DELETE' && type) {
      await driver.deleteType(type);
      return json({ id: type });
    }
  } catch (error) {
    return failure(error, "The change couldn't be saved");
  }
  return json({ message: 'Method not allowed' }, 405);
}

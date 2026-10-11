import {
  data,
  RouterContextProvider,
  type ActionFunctionArgs,
} from 'react-router';
import { flattenToAppURL } from '@plone/helpers';
import { requireAuthCookie } from '@plone/react-router';
import { ploneClientContext } from '@plone/aurora/app/middleware.server';

type CreateContentRequest = {
  path?: string;
  data?: Record<string, unknown>;
};

/*
  The body is either JSON (`{ path?, data }`) or multipart/form-data with an
  optional `path` field, a `data` field holding the JSON payload, and one part
  per binary field, named after the field (e.g. `image` or `file`).
  Binary parts are passed to the client as File values, so they reach Plone
  as multipart/form-data too.
*/
async function readCreateContentRequest(
  request: Request,
): Promise<CreateContentRequest> {
  const contentType = request.headers.get('Content-Type') || '';
  if (!contentType.startsWith('multipart/form-data')) {
    return (await request.json()) as CreateContentRequest;
  }

  const formData = await request.formData();
  const path = formData.get('path');
  const rawData = formData.get('data');

  let data: unknown;
  try {
    data = typeof rawData === 'string' ? JSON.parse(rawData) : undefined;
  } catch {
    data = undefined;
  }

  if (data && typeof data === 'object') {
    const payload = data as Record<string, unknown>;
    formData.forEach((value, key) => {
      if (key !== 'path' && key !== 'data' && typeof value !== 'string') {
        payload[key] = value;
      }
    });
  }

  return {
    path: typeof path === 'string' ? path : undefined,
    data: data as CreateContentRequest['data'],
  };
}

export async function action({
  params,
  request,
  context,
}: ActionFunctionArgs<RouterContextProvider>) {
  await requireAuthCookie(request);

  const cli = context.get(ploneClientContext);

  const body = await readCreateContentRequest(request);
  const pathFromParams = `/${params['*'] || ''}`;
  const path = body.path ?? pathFromParams;

  if (!body.data || typeof body.data !== 'object') {
    return data(
      {
        message: 'Invalid payload: expected a "data" object',
      },
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
  }

  try {
    const response = await cli.createContent({
      path,
      data: body.data as any,
    });

    return data(flattenToAppURL(response.data), {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error: any) {
    const status = Number(error?.status) || 500;
    const message =
      error?.data?.message ||
      error?.message ||
      'Could not create content from upload payload';

    return data(
      {
        message,
        ...(error?.data ? { details: flattenToAppURL(error.data) } : {}),
      },
      {
        status,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
  }
}

import { flattenToAppURL } from '@plone/helpers';
import { requireAuthCookie } from '@plone/react-router';
import {
  type ActionFunctionArgs,
  data,
  redirect,
  RouterContextProvider,
} from 'react-router';
import {
  ploneClientContext,
  ploneContentContext,
} from '@plone/aurora/app/middleware.server';

export async function action({
  params,
  request,
  context,
}: ActionFunctionArgs<RouterContextProvider>) {
  await requireAuthCookie(request);

  const cli = context.get(ploneClientContext);
  const path = `/${params['*'] || ''}`;

  try {
    switch (request.method) {
      case 'POST': {
        const { data: workingCopy } = await cli.createWorkingcopy({ path });
        return redirect(flattenToAppURL(workingCopy['@id']));
      }

      case 'PATCH':
      case 'DELETE': {
        const content = context.get(ploneContentContext);
        const original = content.working_copy_of?.['@id'];

        if (request.method === 'PATCH') {
          await cli.checkInWorkingcopy({ path });
        } else {
          await cli.deleteWorkingcopy({ path });
        }
        return redirect(original ?? '/');
      }
      default:
        return data(
          { message: `Method ${request.method} not allowed` },
          { status: 405 },
        );
    }
  } catch (error: any) {
    const status = Number(error?.status) || 500;
    const message =
      error?.data?.message || error?.message || 'Working copy operation failed';

    return data({ message }, { status });
  }
}

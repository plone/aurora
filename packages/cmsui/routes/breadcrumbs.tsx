import {
  data,
  RouterContextProvider,
  type LoaderFunctionArgs,
} from 'react-router';
import { ploneClientContext } from '@plone/aurora/app/middleware.server';
import { flattenToAppURL } from '@plone/helpers';

export async function loader({
  params,
  context,
}: LoaderFunctionArgs<RouterContextProvider>) {
  const cli = context.get(ploneClientContext);

  const path = `/${params['*'] || ''}`;

  // Call the breadcrumbs endpoint
  let breadcrumbs;
  try {
    ({ data: breadcrumbs } = await cli.getBreadcrumbs({
      path,
    }));
  } catch (error) {
    const status = (error as { status?: number })?.status;
    if (!status) throw error;
    throw data('Content Not Found', { status });
  }

  return data(flattenToAppURL(breadcrumbs), {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

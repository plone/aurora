import {
  data,
  redirect,
  type ActionFunctionArgs,
  RouterContextProvider,
} from 'react-router';
import { requireAuthCookie } from '@plone/react-router';
import { ploneClientContext } from '@plone/aurora/app/middleware.server';
import { flattenToAppURL } from '@plone/helpers';

export async function action({
  request,
  context,
}: ActionFunctionArgs<RouterContextProvider>) {
  await requireAuthCookie(request);
  const form = await request.formData();
  const path = form.get('path');
  const operation = form.get('operation');
  const value = form.get('value');
  if (
    typeof path !== 'string' ||
    !path.startsWith('/') ||
    path.startsWith('//') ||
    typeof value !== 'string' ||
    !value ||
    value.includes('/')
  ) {
    return data({ error: 'Invalid request' }, { status: 400 });
  }
  const cli = context.get(ploneClientContext);
  if (operation === 'workflow') {
    await cli.createWorkflow({ path, transition: value });
  } else if (operation === 'layout') {
    const { data: content } = await cli.getContent({ path });
    const { data: schema } = await cli.getType({ type: content['@type'] });
    if (!schema.layouts?.includes(value))
      return data({ error: 'Invalid layout' }, { status: 400 });
    await cli.updateContent({ path, data: { layout: value } });
  } else if (operation === 'checkout') {
    const result = await cli.createWorkingcopy({
      path: path.replace(/^\//, ''),
    });
    return redirect(flattenToAppURL(result.data['@id']));
  } else if (operation === 'checkin' || operation === 'discard') {
    const result = await cli.getContent({ path });
    const original = (
      result.data as unknown as { working_copy_of?: { '@id': string } }
    ).working_copy_of?.['@id'];
    if (!original)
      return data({ error: 'Not a working copy' }, { status: 400 });
    if (operation === 'checkin')
      await cli.checkInWorkingcopy({ path: path.replace(/^\//, '') });
    else await cli.deleteWorkingcopy({ path: path.replace(/^\//, '') });
    return redirect(flattenToAppURL(original));
  } else {
    return data({ error: 'Invalid operation' }, { status: 400 });
  }
  return { ok: true };
}

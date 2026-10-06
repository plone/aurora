import {
  data,
  RouterContextProvider,
  type ActionFunctionArgs,
} from 'react-router';
import { requireAuthCookie } from '@plone/react-router';
import { ploneClientContext } from '@plone/aurora/app/middleware.server';
import { HandleCatchedError } from '../helpers/Errors';

export async function action({
  request,
  context,
}: ActionFunctionArgs<RouterContextProvider>) {
  await requireAuthCookie(request);

  const cli = context.get(ploneClientContext);

  const formData = await request.formData();
  const path = formData.get('path') as string;
  const files = formData.getAll('file') as File[];
  const titles = formData.getAll('title') as string[];
  const uploads = files.map((file, i) => ({
    name: file.name,
    type: file.type,
    title: titles[i] || file.name,
  }));
  const errors: Array<Record<string, any>> = [];
  const ok: Array<any> = [];
  let responses: Array<any> = [];

  try {
    responses = await Promise.allSettled(
      files.map(async (file, i) => {
        // Files are sent to Plone as multipart/form-data parts.
        const contentData = file.type.startsWith('image/')
          ? { '@type': 'Image' as const, title: uploads[i].title, image: file }
          : { '@type': 'File' as const, title: uploads[i].title, file };

        return cli.createContent({ path, data: contentData });
      }),
    );
  } catch (e) {
    HandleCatchedError(e, 'Error on upload');
  }

  responses.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      ok.push(uploads[i]);
    } else {
      errors.push({ ...uploads[i], __error: r.reason });
    }
  });

  return data({ ok, errors }, 200);
}

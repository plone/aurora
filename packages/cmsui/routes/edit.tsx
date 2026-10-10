import { flattenToAppURL } from '@plone/helpers';
import { requireAuthCookie } from '@plone/react-router';
import {
  data,
  redirect,
  RouterContextProvider,
  useLoaderData,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  ploneClientContext,
  ploneContentContext,
} from '@plone/aurora/app/middleware.server';
import ContentForm from '../components/ContentForm/ContentForm';
import { getServerValidationErrors } from '../components/Form/validation';

export async function loader({
  request,
  context,
}: LoaderFunctionArgs<RouterContextProvider>) {
  await requireAuthCookie(request);

  const cli = context.get(ploneClientContext);
  const content = context.get(ploneContentContext);

  const { data: schema } = await cli.getType({ type: content['@type'] });

  return data(flattenToAppURL({ content, schema }));
}

export async function action({
  params,
  request,
  context,
}: ActionFunctionArgs<RouterContextProvider>) {
  await requireAuthCookie(request);

  const cli = context.get(ploneClientContext);

  const path = `/${params['*'] || ''}`;
  const formData = await request.json();

  try {
    await cli.updateContent({
      path,
      data: formData,
    });
  } catch (error) {
    // Validation errors go back to the form, on their fields.
    const errors = getServerValidationErrors(error);
    if (errors) return data({ errors }, { status: 400 });
    throw error;
  }

  return redirect(path);
}

export default function Edit() {
  const { content, schema } = useLoaderData<typeof loader>();
  const { t } = useTranslation();

  return (
    <ContentForm
      // Remount the form, and with it its store, when editing another item.
      key={content['@id']}
      content={content}
      schema={schema}
      heading={`${content.title} - ${t('cmsui.edit')}`}
      submitMethod="patch"
    />
  );
}

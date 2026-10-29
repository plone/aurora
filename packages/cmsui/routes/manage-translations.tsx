import {
  data,
  Form,
  redirect,
  RouterContextProvider,
  useLoaderData,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from 'react-router';
import { requireAuthCookie } from '@plone/react-router';
import { flattenToAppURL } from '@plone/helpers';
import {
  ploneClientContext,
  ploneContentContext,
} from '@plone/aurora/app/middleware.server';
import { Container, Link } from '@plone/quanta';
import { useTranslation } from 'react-i18next';

export async function loader({
  request,
  params,
  context,
}: LoaderFunctionArgs<RouterContextProvider>) {
  await requireAuthCookie(request);
  const path = `/${params['*'] || ''}`;
  const { data: translations } = await context
    .get(ploneClientContext)
    .getTranslation({ path });
  return {
    path,
    title: context.get(ploneContentContext).title,
    translations: flattenToAppURL(translations.items),
  };
}

export async function action({
  request,
  params,
  context,
}: ActionFunctionArgs<RouterContextProvider>) {
  await requireAuthCookie(request);
  const path = `/${params['*'] || ''}`;
  const form = await request.formData();
  const operation = form.get('operation');
  const value = form.get('value');
  if (typeof value !== 'string' || !value)
    return data({ error: 'Invalid translation' }, { status: 400 });
  const cli = context.get(ploneClientContext);
  if (operation === 'link' && value.startsWith('/') && !value.startsWith('//'))
    await cli.linkTranslation({ path, data: { id: value } });
  else if (operation === 'unlink' && !value.includes('/'))
    await cli.unlinkTranslation({ path, data: { language: value } });
  else return data({ error: 'Invalid translation' }, { status: 400 });
  return redirect(`/@@manage-translations${path === '/' ? '' : path}`);
}

export default function ManageTranslations() {
  const { path, title, translations } = useLoaderData<typeof loader>();
  const { t } = useTranslation();
  return (
    <main>
      <Container width="default">
        <h1>
          {t('cmsui.translations.title', {
            defaultValue: 'Manage translations',
          })}{' '}
          — {title}
        </h1>
        <Link href={path}>
          {t('cmsui.history.back', { defaultValue: 'Back to content' })}
        </Link>
        <ul>
          {translations.map((item) => (
            <li key={item.language}>
              <Link href={item['@id']}>{item.language}</Link>{' '}
              <Form method="post">
                <input type="hidden" name="value" value={item.language} />
                <button
                  name="operation"
                  value="unlink"
                  aria-label={`${t('cmsui.translations.unlink', { defaultValue: 'Unlink' })} ${item.language}`}
                >
                  {t('cmsui.translations.unlink', { defaultValue: 'Unlink' })}
                </button>
              </Form>
            </li>
          ))}
        </ul>
        <Form method="post">
          <label htmlFor="translation-path">
            {t('cmsui.translations.path', {
              defaultValue: 'Path of an existing translation',
            })}
          </label>{' '}
          <input id="translation-path" name="value" required pattern="/.*" />
          <button name="operation" value="link">
            {t('cmsui.translations.link', { defaultValue: 'Link translation' })}
          </button>
        </Form>
      </Container>
    </main>
  );
}

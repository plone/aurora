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
  const { data: aliases } = await context
    .get(ploneClientContext)
    .getAliases({ path });
  return {
    path,
    title: context.get(ploneContentContext).title,
    aliases: aliases.items,
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
  const alias = form.get('alias');
  const operation = form.get('operation');
  if (
    typeof alias !== 'string' ||
    !alias.startsWith('/') ||
    alias.startsWith('//') ||
    !['add', 'delete'].includes(String(operation))
  )
    return data({ error: 'Invalid alias' }, { status: 400 });
  const cli = context.get(ploneClientContext);
  if (operation === 'add')
    await cli.createAlias({ path, data: { items: [{ path: alias }] } });
  else await cli.deleteAliases({ path, data: { items: [{ path: alias }] } });
  return redirect(`/@@aliases${path === '/' ? '' : path}`);
}

export default function Aliases() {
  const { title, path, aliases } = useLoaderData<typeof loader>();
  const { t } = useTranslation();
  return (
    <main>
      <Container width="default">
        <h1>
          {t('cmsui.aliases.title', { defaultValue: 'URL management' })} —{' '}
          {title}
        </h1>
        <Link href={path}>
          {t('cmsui.history.back', { defaultValue: 'Back to content' })}
        </Link>
        <ul>
          {aliases.map((alias) => (
            <li key={alias.path}>
              {alias.path}{' '}
              <Form method="post">
                <input type="hidden" name="alias" value={alias.path} />
                <button
                  type="submit"
                  name="operation"
                  value="delete"
                  aria-label={`${t('cmsui.aliases.remove', { defaultValue: 'Remove' })} ${alias.path}`}
                >
                  {t('cmsui.aliases.remove', { defaultValue: 'Remove' })}
                </button>
              </Form>
            </li>
          ))}
        </ul>
        <Form method="post">
          <label htmlFor="alias">
            {t('cmsui.aliases.new', { defaultValue: 'New URL alias' })}
          </label>{' '}
          <input id="alias" name="alias" required pattern="/.*" />
          <button type="submit" name="operation" value="add">
            {t('cmsui.aliases.add', { defaultValue: 'Add alias' })}
          </button>
        </Form>
      </Container>
    </main>
  );
}

import {
  RouterContextProvider,
  useLoaderData,
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
  const { data } = await context
    .get(ploneClientContext)
    .getRelations({ target: path });
  return {
    path,
    title: context.get(ploneContentContext).title,
    relations: flattenToAppURL(data.relations),
  };
}

export default function LinksToItem() {
  const { path, title, relations } = useLoaderData<typeof loader>();
  const { t } = useTranslation();
  const groups = Object.entries(relations).filter(
    ([, group]) => group.items.length > 0,
  );
  return (
    <main>
      <Container width="default">
        <h1>
          {t('cmsui.linksToItem.title', {
            defaultValue: 'Links and references',
          })}{' '}
          — {title}
        </h1>
        <Link href={path}>
          {t('cmsui.history.back', { defaultValue: 'Back to content' })}
        </Link>
        {groups.length === 0 && (
          <p>
            {t('cmsui.linksToItem.empty', {
              defaultValue: 'No links or references found.',
            })}
          </p>
        )}
        {groups.map(([name, group]) => (
          <section key={name}>
            <h2>{name}</h2>
            <ul>
              {group.items.map((item) => (
                <li key={`${item.source.UID}-${item.target.UID}`}>
                  <Link href={item.source['@id']}>
                    {item.source.title || item.source['@id']}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </Container>
    </main>
  );
}

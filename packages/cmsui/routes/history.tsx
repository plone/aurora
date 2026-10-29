import {
  RouterContextProvider,
  useLoaderData,
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
  const content = context.get(ploneContentContext);
  const path = `/${params['*'] || ''}`;
  const { data: history } = await context
    .get(ploneClientContext)
    .getHistory({ path: path.replace(/^\//, '') });
  return { title: content.title, path, history };
}

export default function History() {
  const { title, path, history } = useLoaderData<typeof loader>();
  const { t, i18n } = useTranslation();
  return (
    <main>
      <Container width="default">
        <h1>
          {t('cmsui.history.title', { defaultValue: 'History' })} — {title}
        </h1>
        <Link href={path}>
          {t('cmsui.history.back', { defaultValue: 'Back to content' })}
        </Link>
        <ol>
          {history.map((item, index) => (
            <li key={`${item.time}-${index}`}>
              <strong>{item.transition_title || item.action}</strong>
              {' — '}
              {item.actor?.fullname || item.actor?.id}
              {' — '}
              {new Date(item.time).toLocaleString(i18n.language)}
              {item.comments && <p>{item.comments}</p>}
            </li>
          ))}
        </ol>
      </Container>
    </main>
  );
}

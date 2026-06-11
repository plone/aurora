import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router';
import { requireAuthCookie } from '@plone/react-router';
import {
  data,
  redirect,
  RouterContextProvider,
  useLoaderData,
} from 'react-router';
import {
  ploneClientContext,
  ploneContentContext,
  ploneUserContext,
} from '@plone/aurora/app/middleware.server';
import { useTranslation } from 'react-i18next';
import { Container, Link } from '@plone/components/quanta';
import { CloseIcon } from '@plone/components/Icons';
import { Plug } from '@plone/layout/components/Pluggable';
import SharingForm from '../components/Sharing/SharingForm';

export async function loader({
  request,
  params,
  context,
}: LoaderFunctionArgs<RouterContextProvider>) {
  await requireAuthCookie(request);

  const cli = context.get(ploneClientContext);
  const content = context.get(ploneContentContext);
  const user = context.get(ploneUserContext);
  const path = `/${params['*'] || ''}`;

  const search = new URL(request.url).searchParams.get('search') ?? '';

  const { data: sharingData } = await cli.getSharing({ path, search });

  return data({
    content: { '@id': content['@id'], title: content.title },
    sharingData,
    search,
    currentUserId: user?.id ?? null,
  });
}

export async function action({
  request,
  params,
  context,
}: ActionFunctionArgs<RouterContextProvider>) {
  await requireAuthCookie(request);

  const cli = context.get(ploneClientContext);
  const content = context.get(ploneContentContext);
  const path = `/${params['*'] || ''}`;

  await cli.updateSharing({ path, data: await request.json() });

  return redirect(content['@id']);
}

export default function Sharing() {
  const { content, sharingData, search, currentUserId } =
    useLoaderData<typeof loader>();
  const { t } = useTranslation();

  return (
    <Container
      id="page-sharing"
      className={`
        mx-auto px-4 py-2
        lg:px-8
      `}
    >
      <Plug
        pluggable="toolbar-top"
        id="button-cancel"
        dependencies={[content['@id']] as any}
      >
        <Link aria-label={t('cmsui.cancel')} href={content['@id']}>
          <CloseIcon />
        </Link>
      </Plug>
      <h1 className="text-2xl font-bold">
        {t('cmsui.sharing.label', { title: content.title })}
      </h1>
      <p>{t('cmsui.sharing.description')}</p>
      <SharingForm
        content={content}
        sharingData={sharingData}
        search={search}
        currentUserId={currentUserId}
      />
    </Container>
  );
}

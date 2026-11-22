import {
  redirect,
  useLoaderData,
  useParams,
  type LinksFunction,
  type LoaderFunctionArgs,
  type RouterContextProvider,
} from 'react-router';
import { ploneClientContext } from '@plone/aurora/app/middleware.server';
import { requireAuthCookie } from '@plone/react-router';
import {
  ContentTypePage,
  contentTypeHref,
  type ContentTypeTab,
} from '@plone/controlpanels';
import { Plug } from '@plone/layout/components/Pluggable';
import { Container, Link } from '@plone/quanta';
import toastStylesheet from '@plone/components/src/styles/basic/Toast.css?url';
import Back from '@plone/icons/svg/arrow-left.svg?react';
import ContentTypesProviders from '../components/ContentTypes/ContentTypesProviders';
import { toCapabilities } from '@plone/controlpanels';
import { contentTypesBackend } from '../helpers/contentTypesBackend';
import { CONTENT_TYPES_PATH } from '../helpers/contentTypesPath';

const TABS: ContentTypeTab[] = [
  'settings',
  'workflow',
  'fields',
  'behaviors',
  'layout',
];

export const links: LinksFunction = () => [
  { rel: 'stylesheet', href: toastStylesheet },
];

export async function loader({
  params,
  request,
  context,
}: LoaderFunctionArgs<RouterContextProvider>) {
  await requireAuthCookie(request);
  const { type = '', tab } = params;
  if (!tab || !TABS.includes(tab as ContentTypeTab)) {
    throw redirect(contentTypeHref(CONTENT_TYPES_PATH, type));
  }
  const backend = await contentTypesBackend(context.get(ploneClientContext));
  return { capabilities: toCapabilities(backend) };
}

/**
 * A content type's page, `/@@controlpanel/content-types/{type}/{tab}`. The
 * screens come from `@plone/controlpanels`, which also runs in Volto.
 */
export default function ContentType() {
  const { type = '', tab } = useParams();
  const { capabilities } = useLoaderData<typeof loader>();
  return (
    <main>
      <Plug pluggable="toolbar-top" id="button-back">
        <Link aria-label="back" href={CONTENT_TYPES_PATH}>
          <Back />
        </Link>
      </Plug>
      <Container width="default" className="route-controlpanel py-6">
        <ContentTypesProviders capabilities={capabilities}>
          <ContentTypePage
            basePath={CONTENT_TYPES_PATH}
            id={type}
            tab={tab as ContentTypeTab}
          />
        </ContentTypesProviders>
      </Container>
    </main>
  );
}

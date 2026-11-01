import {
  useLoaderData,
  type LinksFunction,
  type LoaderFunctionArgs,
  type RouterContextProvider,
} from 'react-router';
import { ploneClientContext } from '@plone/aurora/app/middleware.server';
import { requireAuthCookie } from '@plone/react-router';
import { ContentTypesList, toCapabilities } from '@plone/controlpanels';
import { Plug } from '@plone/layout/components/Pluggable';
import { Container, Link } from '@plone/quanta';
import toastStylesheet from '@plone/components/src/styles/basic/Toast.css?url';
import Back from '@plone/icons/svg/arrow-left.svg?react';
import ContentTypesProviders from '../components/ContentTypes/ContentTypesProviders';
import { contentTypesBackend } from '../helpers/contentTypesBackend';

export const links: LinksFunction = () => [
  { rel: 'stylesheet', href: toastStylesheet },
];

export async function loader({
  request,
  context,
}: LoaderFunctionArgs<RouterContextProvider>) {
  await requireAuthCookie(request);
  const backend = await contentTypesBackend(context.get(ploneClientContext));
  return { capabilities: toCapabilities(backend) };
}

/**
 * The content types control panel, `/controlpanel/content-types`. The
 * screens come from `@plone/controlpanels`, which also runs in Volto.
 */
export default function ContentTypes() {
  const { capabilities } = useLoaderData<typeof loader>();
  return (
    <main>
      <Plug pluggable="toolbar-top" id="button-back">
        <Link aria-label="back" href="/controlpanel">
          <Back />
        </Link>
      </Plug>
      <Container width="default" className="route-controlpanel py-6">
        <ContentTypesProviders capabilities={capabilities}>
          <ContentTypesList />
        </ContentTypesProviders>
      </Container>
    </main>
  );
}

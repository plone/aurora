import type { LinksFunction, LoaderFunctionArgs } from 'react-router';
import { requireAuthCookie } from '@plone/react-router';
import { ContentTypesList } from '@plone/controlpanels';
import { Plug } from '@plone/layout/components/Pluggable';
import { Container, Link } from '@plone/quanta';
import toastStylesheet from '@plone/components/src/styles/basic/Toast.css?url';
import Back from '@plone/icons/svg/arrow-left.svg?react';
import ContentTypesProviders from '../components/ContentTypes/ContentTypesProviders';

export const links: LinksFunction = () => [
  { rel: 'stylesheet', href: toastStylesheet },
];

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAuthCookie(request);
  return null;
}

/**
 * The content types control panel, `/controlpanel/content-types`. The
 * screens come from `@plone/controlpanels`, which also runs in Volto.
 */
export default function ContentTypes() {
  return (
    <main>
      <Plug pluggable="toolbar-top" id="button-back">
        <Link aria-label="back" href="/controlpanel">
          <Back />
        </Link>
      </Plug>
      <Container width="default" className="route-controlpanel py-6">
        <ContentTypesProviders>
          <ContentTypesList />
        </ContentTypesProviders>
      </Container>
    </main>
  );
}

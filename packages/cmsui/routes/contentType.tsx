import type { LinksFunction, LoaderFunctionArgs } from 'react-router';
import { useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { requireAuthCookie } from '@plone/react-router';
import { CONTENT_TYPES_BASE_PATH } from '@plone/controlpanels';
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
 * A content type's page, `/controlpanel/content-types/{type}/{tab}`. Its
 * tabs come in the next phases of #269; for now it names the type and links
 * back to the list.
 */
export default function ContentType() {
  const { t } = useTranslation();
  const { type = '' } = useParams();
  return (
    <main>
      <Plug pluggable="toolbar-top" id="button-back">
        <Link aria-label="back" href={CONTENT_TYPES_BASE_PATH}>
          <Back />
        </Link>
      </Plug>
      <Container width="default" className="route-controlpanel py-6">
        {/* The providers also show notifications from the list, e.g. after
            creating a type, which navigates here. */}
        <ContentTypesProviders>
          <h1 className="text-2xl font-semibold">{type}</h1>
          <p className="mt-2 text-sm text-quanta-pigeon">
            {t('cmsui.contentTypes.comingSoon', {
              defaultValue:
                "This type's settings, fields and behaviors come here.",
            })}
          </p>
        </ContentTypesProviders>
      </Container>
    </main>
  );
}

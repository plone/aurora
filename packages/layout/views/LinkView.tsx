import { useRouteLoaderData } from 'react-router';
import type { RootLoader } from '@plone/aurora/app/root';
import config from '@plone/registry';
import { Link } from '@plone/quanta';
import { useTranslation } from 'react-i18next';
import { isInternalURL } from '@plone/helpers';
import clsx from 'clsx';
import DocumentTitle from '../components/DocumentTitle/DocumentTitle';

export default function LinkView() {
  const rootData = useRouteLoaderData<RootLoader>('root');
  const { t } = useTranslation();
  const Container = config.getComponent('Container').component!;

  if (!rootData || rootData.content['@type'] !== 'Link') {
    return null;
  }

  const { content } = rootData;
  const isInternal = isInternalURL(content.remoteUrl);

  return (
    <Container width="default" className="link-view">
      <DocumentTitle>{content.title}</DocumentTitle>
      <p className="documentDescription">{content.description}</p>
      <p>
        {isInternal
          ? t('layout.views.link.linkLabel')
          : t('layout.views.link.externalLinkLabel')}
        &nbsp;
        <Link
          href={content.remoteUrl}
          target="_blank"
          rel={clsx('noopener', !isInternal && 'noreferrer')}
        >
          {content.remoteUrl}
        </Link>
      </p>
    </Container>
  );
}

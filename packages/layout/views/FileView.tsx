import { useRouteLoaderData } from 'react-router';
import { useTranslation } from 'react-i18next';
import prettybytes from 'pretty-bytes';
import config from '@plone/registry';
import type { RootLoader } from '@plone/aurora/app/root';
import DocumentTitle from '../components/DocumentTitle/DocumentTitle';

export default function FileView() {
  const rootData = useRouteLoaderData<RootLoader>('root');
  const { t } = useTranslation();
  const Container = config.getComponent('Container').component!;
  const Link = config.getComponent('Link').component!;

  if (!rootData || rootData.content['@type'] !== 'File') {
    return null;
  }

  const { content } = rootData;

  return (
    <Container width="default">
      <DocumentTitle>{content.title}</DocumentTitle>
      {content.description && (
        <p className="documentDescription">{content.description}</p>
      )}
      {content.file?.download && (
        <Link href={content.file.download} download={content.file.filename}>
          {t('layout.contenttypes.common.size')}{' '}
          {prettybytes(content.file.size)}
          &nbsp; &mdash; &nbsp;
          {content.file.filename
            ? content.file.filename
            : t('layout.contenttypes.file.download')}
        </Link>
      )}
    </Container>
  );
}

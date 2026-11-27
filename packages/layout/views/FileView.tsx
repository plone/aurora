import { useRouteLoaderData } from 'react-router';
import { useTranslation } from 'react-i18next';
import prettybytes from 'pretty-bytes';
import config from '@plone/registry';
import type { RootLoaderData } from '@plone/types';

export default function FileView() {
  const rootData = useRouteLoaderData<RootLoaderData>('root');
  const { t } = useTranslation();
  const Container = config.getComponent('Container').component!;
  const Link = config.getComponent('Link').component!;

  if (!rootData || rootData.content['@type'] !== 'File') {
    return null;
  }

  const { content } = rootData;

  return (
    <Container width="default">
      <h1 className="documentFirstHeading">{content.title}</h1>
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

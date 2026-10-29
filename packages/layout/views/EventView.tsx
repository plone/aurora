import cx from 'clsx';
import { hasBlocksData } from '@plone/helpers';
import { useRouteLoaderData } from 'react-router';
import type { RootLoader } from '@plone/aurora/app/root';
import RenderBlocks from '../blocks/RenderBlocks';
import EventDetails from '../components/EventDetails/EventDetails';
import config from '@plone/registry';
import styles from './EventView.module.css';
import DocumentTitle from '../components/DocumentTitle/DocumentTitle';

export default function EventView() {
  const rootData = useRouteLoaderData<RootLoader>('root');
  const Container = config.getComponent('Container').component!;

  if (!rootData || rootData.content['@type'] !== 'Event') {
    return null;
  }

  const { content, locale } = rootData;
  const hasBlocks = hasBlocksData(content);

  return (
    <Container
      width="default"
      className={cx(styles['event-view'], 'event-view')}
    >
      <div className="content">
        {hasBlocks ? (
          <RenderBlocks content={content} />
        ) : (
          <>
            <DocumentTitle>{content.title}</DocumentTitle>
            {Boolean(content.description) && (
              <p className="documentDescription">{content.description}</p>
            )}
          </>
        )}
      </div>
      <EventDetails content={content} locale={locale} />
    </Container>
  );
}

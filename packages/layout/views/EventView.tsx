import { hasBlocksData } from '@plone/helpers';
import { useRouteLoaderData } from 'react-router';
import type { RootLoader } from '@plone/aurora/app/root';
import RenderBlocks from '../blocks/RenderBlocks';
import EventDetails from '../components/EventDetails/EventDetails';
import { Container } from '@plone/components';
import styles from './EventView.module.css';

export default function EventView() {
  const rootData = useRouteLoaderData<RootLoader>('root');

  if (!rootData || rootData.content['@type'] !== 'Event') {
    return null;
  }

  const { content, locale } = rootData;
  const hasBlocks = hasBlocksData(content);

  return (
    <Container width="default" className={styles['event-view']}>
      <div className="content">
        {hasBlocks ? (
          <RenderBlocks content={content} />
        ) : (
          <>
            <h1 className="documentFirstHeading">{content.title}</h1>
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

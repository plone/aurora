import RenderBlocks from '../blocks/RenderBlocks';
import type { RootLoader } from '@plone/aurora/app/root';
import config from '@plone/registry';
import { hasBlocksData } from '@plone/helpers';
import { useRouteLoaderData } from 'react-router';

export default function DefaultView() {
  const rootData = useRouteLoaderData<RootLoader>('root');
  const Container = config.getComponent('Container').component!;

  if (!rootData || rootData.content['@type'] !== 'News Item') {
    return null;
  }

  const { content } = rootData;
  const hasBlocks = hasBlocksData(content);

  return (
    <Container width="default">
      {hasBlocks && <RenderBlocks content={content} />}
      {!hasBlocks && (
        <>
          <h1 className="documentFirstHeading">{content.title}</h1>
          {Boolean(content.description) && (
            <p className="documentDescription">{content.description}</p>
          )}
        </>
      )}
    </Container>
  );
}

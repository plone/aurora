import { hasBlocksData } from '@plone/helpers';
import { useRouteLoaderData } from 'react-router';
import type { RootLoader } from '@plone/aurora/app/root';
import RenderBlocks from '../blocks/RenderBlocks';

export default function DefaultView() {
  const rootData = useRouteLoaderData<RootLoader>('root');

  if (!rootData) {
    return null;
  }

  const { content } = rootData;

  if (hasBlocksData(content)) {
    return (
      <>
        <RenderBlocks content={content} />
      </>
    );
  }

  return <h1>{content.title}</h1>;
}

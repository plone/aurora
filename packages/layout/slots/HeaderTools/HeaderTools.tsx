import SlotRenderer, { type SlotComponentProps } from '../SlotRenderer';
import { useRouteLoaderData } from 'react-router';
import type { RootLoader } from '@plone/aurora/app/root';

const HeaderTools = (props: SlotComponentProps) => {
  const rootData = useRouteLoaderData<RootLoader>('root');

  if (!rootData) {
    return null;
  }

  const { isAuthenticated } = rootData;
  const { content, location } = props;

  return (
    <>
      {/* Below 48rem these move into the navigation panel (header.css). */}
      <div className="header-tools-collapsible">
        {isAuthenticated ? (
          <SlotRenderer
            name="authenticatedTools"
            content={content}
            location={location}
          />
        ) : (
          <SlotRenderer
            name="anonymousTools"
            content={content}
            location={location}
          />
        )}
        <SlotRenderer
          name="languageSwitcher"
          content={content}
          location={location}
        />
      </div>
      <SlotRenderer name="searchWidget" content={content} location={location} />
    </>
  );
};

export default HeaderTools;

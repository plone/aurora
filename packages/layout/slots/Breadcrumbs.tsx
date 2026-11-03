import type { SlotComponentProps } from './SlotRenderer';
import config from '@plone/registry';
import { HomeIcon } from '@plone/icons';
import SectionWrapper from '../components/SectionWrapper/SectionWrapper';

const Breadcrumbs = (props: SlotComponentProps) => {
  const { content } = props;
  const PCBreadcrumbs = config.getComponent('Breadcrumbs').component!;
  const PCBreadcrumb = config.getComponent('Breadcrumb').component!;
  const items = content?.['@components']?.breadcrumbs.items;
  const root = content?.['@components']?.breadcrumbs.root;

  const rootItem = {
    '@id': root || '/',
    title: 'Home',
    icon: <HomeIcon size="sm" />,
  };

  const breacrumbs = [rootItem, ...(items || [])];

  return (
    <SectionWrapper
      section="header"
      as="nav"
      width="layout"
      className="breadcrumbs"
    >
      <PCBreadcrumbs items={breacrumbs}>
        {(item) => (
          <PCBreadcrumb id={item['@id']} href={item['@id']}>
            {item.title}
          </PCBreadcrumb>
        )}
      </PCBreadcrumbs>
    </SectionWrapper>
  );
};

export default Breadcrumbs;

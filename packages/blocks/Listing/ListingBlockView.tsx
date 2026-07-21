import type { BlockViewProps, Brain, ListingBlockFormData } from '@plone/types';
import { useTranslation } from 'react-i18next';
import { useQuerystringResults } from './useQuerystringResults';

const hasQuery = (value: ListingBlockFormData['querystring']): boolean =>
  Array.isArray(value?.query) && value.query.length > 0;

/**
 * View listing block component.
 * @class View
 * @extends Component
 */
const ListingBlockView = (props: BlockViewProps) => {
  const data = props.data as ListingBlockFormData;
  const HeadlineTag = data.headlineTag || 'h2';
  const ItemTitleTag = data.headlineTag === 'h2' ? 'h3' : 'h4';
  const { t } = useTranslation();
  const hasListingQuery = hasQuery(data.querystring);
  const { items, loaded } = useQuerystringResults(data.querystring as any);
  const initialItems = props.isEditMode ? [] : (data.items ?? []);
  const listingItems = hasListingQuery ? (loaded ? items : initialItems) : [];

  const getPreviewImageUrl = (item: Brain) => {
    const imageField = item.image_field;
    const imageScales = item.image_scales?.[imageField][0];
    if (!imageField || !imageScales) {
      return;
    }
    return `${imageScales.base_path || item['@id'] || ''}/${imageScales.scales.thumb?.download}`;
  };

  const renderDefault = (item: Brain) => {
    return (
      <div key={item['@id']} className="item">
        <ItemTitleTag>
          <a href={item['@id']}>{item.title || item.id}</a>
        </ItemTitleTag>
        {item.description && <p>{item.description}</p>}
      </div>
    );
  };

  const renderSummary = (item: Brain) => {
    const url = getPreviewImageUrl(item);

    return (
      <div key={item['@id']} className="item summary">
        {url && <img src={url} alt=""></img>}
        <div>
          <ItemTitleTag>
            <a href={item['@id']}>{item.title || item.id}</a>
          </ItemTitleTag>
          {item.description && <p>{item.description}</p>}
        </div>
      </div>
    );
  };

  return (
    <>
      {data.headline ? <HeadlineTag>{data.headline}</HeadlineTag> : ''}
      {listingItems.length === 0 ? (
        <div>{t('blocks.listing.no-results')}</div>
      ) : (
        listingItems.map((item) =>
          data.variation === 'summary'
            ? renderSummary(item)
            : renderDefault(item),
        )
      )}
    </>
  );
};

export default ListingBlockView;

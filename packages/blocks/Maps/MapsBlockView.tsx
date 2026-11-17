import type { BlockViewProps } from '@plone/types';

const MapsBlockView = (props: BlockViewProps) => {
  const { data } = props;

  return data.url ? (
    <div className="block-maps__frame">
      <iframe
        title={data?.title}
        src={data.url}
        className="block-maps__iframe"
        allowFullScreen
      />
    </div>
  ) : null;
};

export default MapsBlockView;

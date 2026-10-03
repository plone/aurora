import type { BlockViewProps } from '@plone/types';
import clsx from 'clsx';
import { VideoBlockBody, type VideoData } from './VideoBlockBody';

type VideoBlockViewProps = {
  data: BlockViewProps['data'];
  className?: BlockViewProps['className'];
  isEditMode?: BlockViewProps['isEditMode'];
};

const VideoBlockView = (props: VideoBlockViewProps) => {
  const { data, className, isEditMode } = props;

  if (!data?.url) return null;

  return (
    <div
      className={clsx('block-video__wrapper', className)}
      data-align={data.align || 'center'}
    >
      <figure className="block-video__figure">
        <VideoBlockBody data={data as VideoData} isEditMode={isEditMode} />
      </figure>
    </div>
  );
};

export default VideoBlockView;

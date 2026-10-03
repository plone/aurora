import type { ConfigType } from '@plone/registry';
import AttachmentIcon from '@plone/icons/svg/attachment.svg?react';
import CalendarIcon from '@plone/icons/svg/calendar.svg?react';
import CollectionIcon from '@plone/icons/svg/collection.svg?react';
import FolderIcon from '@plone/icons/svg/folder.svg?react';
import ImageIcon from '@plone/icons/svg/image.svg?react';
import LinkIcon from '@plone/icons/svg/link.svg?react';
import NewsIcon from '@plone/icons/svg/news.svg?react';
import VideoIcon from '@plone/icons/svg/video.svg?react';
import PageIcon from '@plone/icons/svg/page.svg?react';

export default function install(config: ConfigType) {
  config.settings.hideBreadcrumbs = ['Plone Site', 'Subsite', 'LRF'];

  config.settings.contentIcons = {
    Document: PageIcon,
    Folder: FolderIcon,
    'News Item': NewsIcon,
    Event: CalendarIcon,
    Image: ImageIcon,
    File: AttachmentIcon,
    Link: LinkIcon,
    Video: VideoIcon,
    Collection: CollectionIcon,
  };

  config.settings.mostUsedTypes = ['Document', 'Folder', 'File'];

  return config;
}

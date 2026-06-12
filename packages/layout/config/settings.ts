import type { ConfigType } from '@plone/registry';
import pageSVG from '@plone/components/icons/page.svg?react';
import folderSVG from '@plone/components/icons/folder.svg?react';
import newsSVG from '@plone/components/icons/news.svg?react';
import calendarSVG from '@plone/components/icons/calendar.svg?react';
import imageSVG from '@plone/components/icons/image.svg?react';
import linkSVG from '@plone/components/icons/link.svg?react';

export default function install(config: ConfigType) {
  config.settings.hideBreadcrumbs = ['Plone Site', 'Subsite', 'LRF'];

  // Registered here (not only in @plone/contents) so the public UI has it too.
  config.settings.contentIcons = {
    Document: pageSVG,
    Folder: folderSVG,
    'News Item': newsSVG,
    Event: calendarSVG,
    Image: imageSVG,
    File: pageSVG,
    Link: linkSVG,
    ...(config.settings.contentIcons ?? {}),
  };

  return config;
}

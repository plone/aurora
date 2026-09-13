import type { ContentBase } from '../base';

export interface PloneSiteContent extends ContentBase {
  '@type': 'Plone Site';
}

declare module '../index' {
  interface ContentTypeMap {
    'Plone Site': PloneSiteContent;
  }
}

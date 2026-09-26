import { describe, expect, it } from 'vitest';
import { getContentPathFromCmsUrl } from './cmsPath';

describe('getContentPathFromCmsUrl', () => {
  it('maps add and edit CMS routes to the content they act on', () => {
    expect(getContentPathFromCmsUrl('/@@add')).toBe('/');
    expect(getContentPathFromCmsUrl('/@@add/my-folder')).toBe('/my-folder');
    expect(getContentPathFromCmsUrl('/@@edit')).toBe('/');
    expect(getContentPathFromCmsUrl('/@@edit/welcome')).toBe('/welcome');
  });
});

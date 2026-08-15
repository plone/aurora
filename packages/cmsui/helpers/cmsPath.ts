/**
 * Map CMS UI routes (`/@@add`, `/@@edit/...`) to the content path they act on.
 */
export function getContentPathFromCmsUrl(
  currentPath?: string,
): string | undefined {
  if (!currentPath) return undefined;

  let path = currentPath.split('?')[0].split('#')[0] || '/';
  if (!path.startsWith('/')) path = `/${path}`;

  if (
    path === '/@@add' ||
    path === '/@@edit' ||
    path === '/@@add/' ||
    path === '/@@edit/'
  ) {
    return '/';
  }

  if (path.startsWith('/@@add/')) {
    const rest = path.slice('/@@add/'.length);
    return rest ? `/${rest}` : '/';
  }

  if (path.startsWith('/@@edit/')) {
    const rest = path.slice('/@@edit/'.length);
    return rest ? `/${rest}` : '/';
  }

  if (path.includes('@@')) return '/';
  return path;
}

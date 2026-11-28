import ChevronRight from '@plone/icons/svg/chevron-right.svg?react';
import { Link } from '@plone/quanta';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

/** An item of the editor's breadcrumb trail. */
export type EditorBreadcrumb = { '@id': string; title: string };

/**
 * The trail to an item, from plone.restapi's `breadcrumbs` component: the
 * navigation root first, then the items down to (and with) the item.
 */
export function breadcrumbTrail(
  breadcrumbs: { root?: string; items?: EditorBreadcrumb[] } | undefined,
  homeTitle: string,
): EditorBreadcrumb[] {
  return [
    { '@id': breadcrumbs?.root || '/', title: homeTitle },
    ...(breadcrumbs?.items ?? []),
  ];
}

/**
 * The editor's breadcrumb trail. Its last item is the item being edited (or
 * added): the current page, not a link. `badge` follows the trail, for
 * example to tell that the item is a translation.
 *
 * Plain markup rather than Quanta's `Breadcrumbs`: React Aria's collections
 * can't render on the server, and the editor is rendered there.
 */
export default function EditorBreadcrumbs({
  items,
  badge,
}: {
  items: EditorBreadcrumb[];
  badge?: ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <nav
      aria-label={t('cmsui.editor.breadcrumbs')}
      className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-sm"
    >
      <ol className="flex min-w-0 flex-wrap items-center gap-1">
        {items.map((item, index) =>
          index < items.length - 1 ? (
            <li
              key={`${index}:${item['@id']}`}
              className="flex items-center gap-1"
            >
              <Link
                href={item['@id']}
                className={`
                  text-quanta-pigeon no-underline
                  hover:text-quanta-denim hover:underline
                `}
              >
                {item.title}
              </Link>
              <ChevronRight aria-hidden className="size-4 text-quanta-silver" />
            </li>
          ) : (
            <li key={`${index}:${item['@id']}`}>
              <span
                aria-current="page"
                className="font-medium text-quanta-denim"
              >
                {item.title}
              </span>
            </li>
          ),
        )}
      </ol>
      {badge}
    </nav>
  );
}

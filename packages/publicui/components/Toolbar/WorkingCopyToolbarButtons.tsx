import { useTranslation } from 'react-i18next';
import { useFetcher, useLocation } from 'react-router';
import Copy from '@plone/components/icons/copy.svg?react';
import Checkbox from '@plone/components/icons/checkbox.svg?react';
import Bin from '@plone/components/icons/bin.svg?react';
import { contentRouteUrl, hasAction } from '@plone/layout/helpers';
import type { Content } from '@plone/types';

/**
 * Temporary until the "more actions" menu exists — the working-copy actions
 * move there as menu entries.
 */
export const WorkingCopyToolbarButtons = ({
  content,
}: {
  content: Content;
}) => {
  const { t } = useTranslation();
  const location = useLocation();
  const fetcher = useFetcher();

  const isPending = fetcher.state !== 'idle';

  const submit = (method: 'post' | 'patch' | 'delete') => {
    return fetcher.submit(null, {
      method,
      action: contentRouteUrl('@@working-copy', location.pathname),
    });
  };

  return (
    <>
      {hasAction(content, 'iterate_checkout') && (
        <button
          type="button"
          aria-label={t('publicui.workingcopy.create')}
          disabled={isPending}
          onClick={() => submit('post')}
        >
          <Copy />
        </button>
      )}
      {hasAction(content, 'iterate_checkin') && (
        <button
          type="button"
          aria-label={t('publicui.workingcopy.apply')}
          disabled={isPending}
          onClick={() => submit('patch')}
        >
          <Checkbox />
        </button>
      )}
      {hasAction(content, 'iterate_checkout_cancel') && (
        <button
          type="button"
          aria-label={t('publicui.workingcopy.discard')}
          disabled={isPending}
          onClick={() => submit('delete')}
        >
          <Bin />
        </button>
      )}
    </>
  );
};

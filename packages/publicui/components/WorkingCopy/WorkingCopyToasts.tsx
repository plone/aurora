import { useEffect } from 'react';
import { useDateFormatter } from 'react-aria';
import { Trans, useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import config from '@plone/registry';
import Info from '@plone/components/icons/info.svg?react';
import type { ToastQueue } from '@plone/layout/config/toast';
import type { Content } from '@plone/types';

export const WorkingCopyToasts = ({ content }: { content: Content }) => {
  const workingCopy = content.working_copy;
  const workingCopyOf = content.working_copy_of;
  const { t } = useTranslation();
  const dateFormatter = useDateFormatter({ dateStyle: 'long' });

  useEffect(() => {
    if (!workingCopy) return;

    const queue: ToastQueue = config
      .getUtility({ name: 'queue', type: 'toast' })
      .method();

    const key = queue.add({
      icon: <Info />,
      title: workingCopyOf ? (
        <Trans
          i18nKey="publicui.workingcopy.isCopy"
          values={{ title: workingCopyOf.title }}
          components={{ lnk: <Link to={workingCopyOf['@id']} /> }}
        />
      ) : (
        <Trans
          i18nKey="publicui.workingcopy.hasCopy"
          values={{ title: workingCopy.title }}
          components={{ lnk: <Link to={workingCopy['@id']} /> }}
        />
      ),
      description: t('publicui.workingcopy.createdBy', {
        creator: workingCopy.creator_name,
        date: dateFormatter.format(new Date(workingCopy.created)),
      }),
    });

    return () => queue.close(key);
  }, [workingCopy, workingCopyOf, dateFormatter, t]);

  return null;
};

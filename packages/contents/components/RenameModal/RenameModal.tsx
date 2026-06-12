import { useEffect, useMemo, useState } from 'react';
import { useFetcher, useRevalidator, type SubmitTarget } from 'react-router';
import { Button, Heading } from 'react-aria-components';
import { useTranslation } from 'react-i18next';
import { getContentIcon } from '@plone/helpers';
import {
  Button as QuantaButton,
  Dialog,
  Input,
  Modal,
  Separator,
} from '@plone/components/quanta';
import { ArrowrightIcon, CloseIcon, RenameIcon } from '@plone/components/Icons';
import { type ToastItem } from '@plone/layout/config/toast';
import { useContentsContext } from '../../providers/contents';
import { buildRenamePayload, type RenameEdit } from '../../helpers/rename';

export default function RenameModal() {
  const { t } = useTranslation();
  const fetcher = useFetcher();
  const { revalidate } = useRevalidator();
  const { showRename, setShowRename, selected, setSelected, showToast } =
    useContentsContext();

  const items = useMemo(() => [...selected], [selected]);
  const [rows, setRows] = useState<RenameEdit[]>([]);

  useEffect(() => {
    if (showRename) {
      setRows(
        items.map((item) => ({
          '@id': item['@id'],
          originalId: item.id,
          originalTitle: item.title ?? '',
          id: item.id,
          title: item.title ?? '',
        })),
      );
    }
  }, [showRename, items]);

  useEffect(() => {
    if (fetcher.state === 'idle' && fetcher.data) {
      const data = fetcher.data;
      if (data?.ok?.length > 0) {
        const toast: ToastItem = {
          title:
            data.ok.length === 1
              ? t('contents.actions.renamed', { title: data.ok[0].title })
              : t('contents.actions.renamed_multiple', {
                  number: data.ok.length,
                }),
          icon: <RenameIcon />,
        };
        showToast(toast);
        revalidate();
      }
      if (data?.errors?.length > 0) {
        data.errors.forEach((e: any) => {
          showToast({
            title: `${t('contents.error')} ${e.__error?.status} - ${e.__error?.data?.type}`,
            description: e.__error?.data?.message,
            icon: <RenameIcon />,
            className: 'error',
          });
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetcher.state]);

  if (!showRename) return null;

  const close = () => {
    setSelected('none');
    setShowRename(false);
  };

  const updateRow = (index: number, field: 'id' | 'title', value: string) => {
    setRows(
      rows.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    );
  };

  const confirm = () => {
    const itemsToRename = buildRenamePayload(rows);
    if (itemsToRename.length === 0) {
      close();
      return;
    }
    fetcher.submit({ items: itemsToRename } as unknown as SubmitTarget, {
      method: 'PATCH',
      encType: 'application/json',
      action: '/@@contents/@@rename',
    });
    close();
  };

  return (
    <Modal isDismissable isOpen={showRename} onOpenChange={setShowRename}>
      <Dialog className="mx-auto w-full p-8">
        <div className="mb-10 flex items-center justify-between">
          <Heading
            slot="title"
            className="react-aria-Heading text-xl font-bold"
          >
            {t('contents.modal_rename.title')}
          </Heading>
          <Button
            onPress={close}
            aria-label={t('contents.modal.close')}
            className={`
              cursor-pointer text-quanta-space
              hover:text-quanta-sapphire
              [&_svg]:size-5
            `}
          >
            <CloseIcon />
          </Button>
        </div>
        <div className="mx-auto max-w-sm">
          {rows.map((row, index) => {
            const item = items[index];
            const Icon = getContentIcon(item?.['@type'], item?.is_folderish);
            return (
              <div key={row['@id']}>
                {index > 0 && <Separator className="my-6 bg-quanta-silver" />}
                <label className="block">
                  <span className="text-quanta-graphite mb-1 block text-xs">
                    {t('contents.modal_rename.name')}
                  </span>
                  <div className="relative">
                    <span
                      className={`
                        pointer-events-none absolute start-3 top-1/2 -translate-y-1/2
                        text-quanta-space
                        [&_svg]:size-4
                      `}
                    >
                      <Icon />
                    </span>
                    <Input
                      type="text"
                      value={row.title}
                      onChange={(e) =>
                        updateRow(index, 'title', e.target.value)
                      }
                      aria-label={`${t('contents.modal_rename.name')}: ${row.originalTitle}`}
                      className="h-11 w-full rounded-lg ps-10 pe-3"
                    />
                  </div>
                </label>
                <label className="mt-4 block">
                  <span className="text-quanta-graphite mb-1 block text-xs">
                    {t('contents.modal_rename.url')}
                  </span>
                  <Input
                    type="text"
                    value={row.id}
                    onChange={(e) => updateRow(index, 'id', e.target.value)}
                    aria-label={`${t('contents.modal_rename.url')}: ${row.originalId}`}
                    className="h-11 w-full rounded-lg px-3"
                  />
                </label>
              </div>
            );
          })}
          <div className="mt-10 flex justify-end">
            <QuantaButton
              onPress={confirm}
              aria-label={t('contents.modal_rename.confirm')}
              variant="primary"
              accent={true}
              size="L"
              isDisabled={rows.length === 0 || fetcher.state !== 'idle'}
            >
              <ArrowrightIcon />
            </QuantaButton>
          </div>
        </div>
      </Dialog>
    </Modal>
  );
}

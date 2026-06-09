import { useEffect, useMemo, useState } from 'react';
import { useFetcher, useRevalidator, type SubmitTarget } from 'react-router';
import { Heading } from 'react-aria-components';
import { useTranslation } from 'react-i18next';
import { Button, Dialog, Input, Modal } from '@plone/components/quanta';
import { CloseIcon, RenameIcon } from '@plone/components/Icons';
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
        <Heading
          slot="title"
          className="react-aria-Heading mb-6 text-xl font-bold"
        >
          {t('contents.modal_rename.title')}
        </Heading>
        <div className="mx-auto max-w-2xl">
          <table className="mb-6 w-full border-collapse text-sm">
            <thead>
              <tr className="text-quanta-graphite border-b border-quanta-silver text-left">
                <th className="pb-2 font-normal">
                  {t('contents.modal_rename.columns.name')}
                </th>
                <th className="pb-2 font-normal">
                  {t('contents.modal_rename.columns.title')}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={row['@id']} className="border-b border-quanta-silver">
                  <td className="py-3 pe-3">
                    <Input
                      type="text"
                      value={row.id}
                      onChange={(e) => updateRow(index, 'id', e.target.value)}
                      aria-label={`${t('contents.modal_rename.columns.name')}: ${row.originalId}`}
                    />
                  </td>
                  <td className="py-3">
                    <Input
                      type="text"
                      value={row.title}
                      onChange={(e) =>
                        updateRow(index, 'title', e.target.value)
                      }
                      aria-label={`${t('contents.modal_rename.columns.title')}: ${row.originalTitle}`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-8 flex justify-center gap-3">
            <Button
              onPress={close}
              aria-label={t('contents.modal.close')}
              accent={true}
              size="L"
            >
              <CloseIcon />
            </Button>
            <Button
              onPress={confirm}
              aria-label={t('contents.modal_rename.confirm')}
              variant="primary"
              accent={true}
              size="L"
              isDisabled={rows.length === 0 || fetcher.state !== 'idle'}
            >
              <RenameIcon />
            </Button>
          </div>
        </div>
      </Dialog>
    </Modal>
  );
}

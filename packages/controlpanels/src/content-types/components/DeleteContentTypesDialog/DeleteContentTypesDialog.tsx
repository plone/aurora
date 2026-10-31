import { useState } from 'react';
import { Button, Dialog, Heading, Modal } from '@plone/quanta';
import {
  useNotify,
  useTranslate,
} from '../../../provider/ControlPanelsProvider';
import { useContentTypesDriver } from '../../driver';
import { messages } from '../../messages';
import type { ContentTypeSummary } from '../../types';

export interface DeleteContentTypesDialogProps {
  /** The types to delete. The dialog is open while there are any. */
  types: ContentTypeSummary[];
  onClose: () => void;
  /** Called with the ids of the types that were deleted. */
  onDeleted: (ids: string[]) => void;
}

/**
 * Confirms deleting one or more types. Types that still have items can't be
 * deleted: the dialog lists them with their item counts.
 */
export function DeleteContentTypesDialog({
  types,
  onClose,
  onDeleted,
}: DeleteContentTypesDialogProps) {
  const t = useTranslate();
  const notify = useNotify();
  const driver = useContentTypesDriver();
  const [isDeleting, setIsDeleting] = useState(false);

  const blocked = types.filter((type) => type.count > 0);
  const deletable = types.filter(
    (type) => type.count === 0 && type.kind !== 'site',
  );
  const title =
    types.length === 1
      ? t(messages.deleteTitle, { title: types[0].title })
      : t(messages.deleteManyTitle, { count: types.length });

  const onDelete = async () => {
    setIsDeleting(true);
    const deleted: ContentTypeSummary[] = [];
    for (const type of deletable) {
      try {
        await driver.deleteType(type.id);
        deleted.push(type);
      } catch (error) {
        notify({
          title: t(messages.deleteError, { title: type.title }),
          description: error instanceof Error ? error.message : undefined,
          variant: 'error',
        });
      }
    }
    setIsDeleting(false);
    if (deleted.length) {
      notify({
        title:
          deleted.length === 1
            ? t(messages.deleted, { title: deleted[0].title })
            : t(messages.deletedMany, { count: deleted.length }),
        variant: 'success',
      });
      onDeleted(deleted.map((type) => type.id));
    }
    onClose();
  };

  return (
    <Modal
      isOpen={types.length > 0}
      onOpenChange={(isOpen) => !isOpen && onClose()}
      isDismissable={!isDeleting}
    >
      <Dialog
        role="alertdialog"
        className="mx-auto flex w-full flex-col gap-4 p-8"
      >
        <Heading slot="title" className="text-xl font-semibold">
          {title}
        </Heading>
        {deletable.length > 0 && (
          <p className="text-sm">{t(messages.deleteExplanation)}</p>
        )}
        {blocked.length > 0 && (
          <div className="flex flex-col gap-1 text-sm">
            <p>{t(messages.deleteBlocked)}</p>
            <ul className="list-disc pl-5">
              {blocked.map((type) => (
                <li key={type.id}>
                  {t(messages.deleteBlockedItem, {
                    title: type.title,
                    count: type.count,
                  })}
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="flex justify-end gap-2">
          <Button onPress={onClose} isDisabled={isDeleting}>
            {deletable.length ? t(messages.cancel) : t(messages.close)}
          </Button>
          {deletable.length > 0 && (
            <Button
              variant="destructive"
              accent
              onPress={onDelete}
              isPending={isDeleting}
            >
              {deletable.length === 1
                ? t(messages.deleteConfirm)
                : t(messages.deleteConfirmMany, { count: deletable.length })}
            </Button>
          )}
        </div>
      </Dialog>
    </Modal>
  );
}

import { useTranslation } from 'react-i18next';
import { Button, Heading, ModalSheet } from '@plone/quanta';

type RemoveItemDialogProps = {
  /** The name of the item to remove, or `null` when the dialog is closed. */
  title: string | null;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * Asks before an item is removed. Nothing is saved yet, but a removed item
 * could otherwise only be recovered by cancelling every other change of the
 * form with it.
 */
export function RemoveItemDialog({
  title,
  onConfirm,
  onCancel,
}: RemoveItemDialogProps) {
  const { t } = useTranslation();
  return (
    <ModalSheet
      isOpen={title !== null}
      onOpenChange={(isOpen) => {
        if (!isOpen) onCancel();
      }}
      className="[--modal-max-width:400px]"
    >
      <Heading slot="title" className="mb-2 text-xl font-bold">
        {t('cmsui.widgets.objectList.removeTitle', { title })}
      </Heading>
      <p className="text-sm text-quanta-iron">
        {t('cmsui.widgets.objectList.removeDescription')}
      </p>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="neutral" onPress={onCancel}>
          {t('cmsui.widgets.objectList.cancel')}
        </Button>
        <Button variant="destructive" accent onPress={onConfirm}>
          {t('cmsui.widgets.objectList.remove')}
        </Button>
      </div>
    </ModalSheet>
  );
}

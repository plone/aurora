import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAtomValue } from 'jotai';
import { Button, Heading, ModalSheet } from '@plone/quanta';
import { FormProvider, useFormStore } from '@plone/helpers';
import { ObjectFields } from '../ObjectWidget/ObjectFields';
import { buildSchemaValidators } from '../Form/validation';
import type {
  ItemSchema,
  ItemSchemaEnhancer,
  ObjectListItem,
} from './objectList';

type ItemDialogProps = {
  /** The item being edited, or a new one. */
  item: ObjectListItem;
  isNew: boolean;
  /** Names one item, such as "Link". */
  itemName: string;
  schema: ItemSchema;
  schemaEnhancer?: ItemSchemaEnhancer;
  onSave: (item: ObjectListItem) => void;
  onCancel: () => void;
};

/**
 * Edits one item in a dialog: a bottom sheet on phones.
 *
 * The dialog edits a draft in a form of its own, with the validators of the
 * item schema. Save checks the draft and writes it to the list; Cancel throws
 * it away. The list never holds an item the dialog found invalid.
 */
export function ItemDialog({
  item,
  isNew,
  itemName,
  schema,
  schemaEnhancer,
  onSave,
  onCancel,
}: ItemDialogProps) {
  const { t } = useTranslation();
  const validators = useMemo(
    () => buildSchemaValidators<ObjectListItem>(schema, { t }),
    // The dialog remounts for each item.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const draft = useFormStore<ObjectListItem>({
    key: item['@id'] ?? 'new',
    initialValues: item,
    validators,
    onSubmit: (values) => onSave(values),
  });
  const values = useAtomValue(draft.valuesAtom, { store: draft.store });
  const fieldsSchema = schemaEnhancer
    ? schemaEnhancer({ schema, formData: values, t })
    : schema;

  return (
    <ModalSheet
      isOpen
      onOpenChange={(isOpen) => {
        if (!isOpen) onCancel();
      }}
      className="[--modal-max-width:560px]"
    >
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          // The dialog renders in a portal, and React passes a portal's
          // events to its ancestors: without this, the submit would reach
          // the content form this widget sits in.
          event.stopPropagation();
          void draft.submit();
        }}
        className="flex flex-col gap-6"
      >
        <Heading slot="title" className="text-xl font-bold">
          {t(
            isNew
              ? 'cmsui.widgets.objectList.add'
              : 'cmsui.widgets.objectList.editTitle',
            { item: itemName },
          )}
        </Heading>
        <FormProvider form={draft}>
          <ObjectFields schema={fieldsSchema} path="" />
        </FormProvider>
        <div className="flex justify-end gap-2">
          <Button variant="neutral" onPress={onCancel}>
            {t('cmsui.widgets.objectList.cancel')}
          </Button>
          <Button type="submit" variant="primary" accent>
            {t(
              isNew
                ? 'cmsui.widgets.objectList.addButton'
                : 'cmsui.widgets.objectList.save',
            )}
          </Button>
        </div>
      </form>
    </ModalSheet>
  );
}

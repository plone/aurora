import {
  Button,
  Heading,
  Select,
  Sheet,
  Switch,
  TextAreaField,
  TextField,
} from '@plone/quanta';
import { useTranslate } from '../../../provider/ControlPanelsProvider';
import { messages } from '../../messages';
import {
  fieldsetOf,
  holdsCustomFields,
  isCustomField,
  removeField,
  updateField,
} from '../../schemaEditing';
import type { FieldType, TypeSchema } from '../../types';

export interface FieldEditorProps {
  schema: TypeSchema;
  /** The field to edit, or `null` when the editor is closed. */
  field: string | null;
  /** Called with the schema after every change. */
  onChange: (schema: TypeSchema) => void;
  onClose: () => void;
  /** To show the field's kind by its title. */
  fieldTypes?: FieldType[];
}

/**
 * A side sheet that edits one of the type's own fields. Changes apply as
 * they're made, and are saved with the rest of the type.
 */
export function FieldEditor({
  schema,
  field,
  onChange,
  onClose,
  fieldTypes = [],
}: FieldEditorProps) {
  const t = useTranslate();
  const entry = field ? schema.properties[field] : undefined;
  const isOpen = !!field && isCustomField(entry);

  return (
    <Sheet
      position="right"
      isOpen={isOpen}
      onOpenChange={(open) => !open && onClose()}
    >
      {field && entry && (
        <div className="flex flex-col gap-5">
          <Heading slot="title" className="text-lg font-semibold">
            {t(messages.editField)}
          </Heading>
          <TextField
            label={t(messages.fieldLabel)}
            value={entry.title}
            onChange={(title) =>
              onChange(updateField(schema, field, { title }))
            }
            isRequired
            isInvalid={!entry.title.trim()}
            autoFocus
          />
          <TextField
            label={t(messages.shortName)}
            value={field}
            description={t(messages.fieldShortNameHelp)}
            isReadOnly
          />
          <TextAreaField
            label={t(messages.fieldHelp)}
            value={entry.description ?? ''}
            onChange={(description) =>
              onChange(updateField(schema, field, { description }))
            }
          />
          <TextField
            label={t(messages.fieldType)}
            value={
              fieldTypes.find((type) => type.id === entry.factory)?.title ??
              entry.factory ??
              entry.type ??
              ''
            }
            isReadOnly
          />
          <Switch
            isSelected={schema.required.includes(field)}
            onChange={(required) =>
              onChange(updateField(schema, field, { required }))
            }
          >
            {t(messages.required)}
          </Switch>
          <Select
            label={t(messages.fieldset)}
            selectedKey={fieldsetOf(schema, field)?.id ?? null}
            onSelectionChange={(key) =>
              key &&
              onChange(updateField(schema, field, { fieldset: String(key) }))
            }
            items={schema.fieldsets.filter(holdsCustomFields).map((entry) => ({
              label: entry.title,
              value: entry.id,
            }))}
          />
          <div className="flex justify-between gap-2">
            <Button
              variant="destructive"
              onPress={() => {
                onChange(removeField(schema, field));
                onClose();
              }}
            >
              {t(messages.deleteField)}
            </Button>
            <Button variant="primary" accent onPress={onClose}>
              {t(messages.done)}
            </Button>
          </div>
        </div>
      )}
    </Sheet>
  );
}

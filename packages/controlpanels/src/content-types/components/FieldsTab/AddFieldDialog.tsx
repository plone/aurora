import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Form } from 'react-aria-components';
import {
  Button,
  Dialog,
  Heading,
  Modal,
  Select,
  Switch,
  TextAreaField,
  TextField,
} from '@plone/quanta';
import { useTranslate } from '../../../provider/ControlPanelsProvider';
import { messages } from '../../messages';
import { addField, holdsCustomFields, isNameTaken } from '../../schemaEditing';
import { isValidShortName, toShortName } from '../../shortName';
import type { FieldType, TypeSchema } from '../../types';

export interface AddFieldDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  schema: TypeSchema;
  /** The fieldset the field goes in, unless the editor picks another one. */
  fieldset: string;
  /** The kinds of fields to choose from, `undefined` while they load. */
  fieldTypes?: FieldType[];
  /** Whether the field types couldn't be loaded. */
  fieldTypesError?: boolean;
  /** Called with the schema with the new field, and the field's name. */
  onAdd: (schema: TypeSchema, field: string) => void;
}

/**
 * The dialog that adds a field to the type. The field is part of the
 * unsaved changes until the type is saved.
 */
export function AddFieldDialog({
  isOpen,
  onOpenChange,
  schema,
  fieldset: initialFieldset,
  fieldTypes,
  fieldTypesError,
  onAdd,
}: AddFieldDialogProps) {
  const t = useTranslate();

  const [label, setLabel] = useState('');
  const [shortName, setShortName] = useState('');
  const [shortNameEdited, setShortNameEdited] = useState(false);
  const [description, setDescription] = useState('');
  const [factory, setFactory] = useState<string | null>(null);
  const [required, setRequired] = useState(false);
  const [fieldset, setFieldset] = useState(initialFieldset);

  // Start fresh every time the dialog opens.
  useEffect(() => {
    if (!isOpen) return;
    setLabel('');
    setShortName('');
    setShortNameEdited(false);
    setDescription('');
    setFactory(null);
    setRequired(false);
    setFieldset(initialFieldset);
  }, [isOpen, initialFieldset]);

  const effectiveShortName = shortNameEdited ? shortName : toShortName(label);
  const shortNameError = !effectiveShortName
    ? undefined
    : !isValidShortName(effectiveShortName)
      ? t(messages.shortNameInvalid)
      : isNameTaken(schema, effectiveShortName)
        ? t(messages.nameTaken)
        : undefined;
  const isValid =
    label.trim() !== '' &&
    effectiveShortName !== '' &&
    !shortNameError &&
    factory !== null;

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isValid) return;
    onAdd(
      addField(schema, {
        id: effectiveShortName,
        title: label.trim(),
        description: description.trim(),
        factory,
        required,
        fieldset,
      }),
      effectiveShortName,
    );
    onOpenChange(false);
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} isDismissable>
      <Dialog className="mx-auto w-full p-8">
        <Form onSubmit={onSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <Heading slot="title" className="text-xl font-semibold">
              {t(messages.addFieldTitle)}
            </Heading>
            <p className="text-sm text-quanta-pigeon">
              {t(messages.addFieldDescription)}
            </p>
          </div>
          <TextField
            label={t(messages.fieldLabel)}
            value={label}
            onChange={setLabel}
            isRequired
            autoFocus
          />
          <TextField
            label={t(messages.shortName)}
            value={effectiveShortName}
            onChange={(value) => {
              setShortName(value);
              setShortNameEdited(true);
            }}
            description={t(messages.fieldShortNameHelp)}
            isInvalid={!!shortNameError}
            errorMessage={shortNameError}
            isRequired
          />
          <Select
            label={t(messages.fieldType)}
            selectedKey={factory}
            onSelectionChange={(key) => setFactory(key ? String(key) : null)}
            items={(fieldTypes ?? []).map((type) => ({
              label: type.title,
              value: type.id,
            }))}
            isDisabled={!fieldTypes}
            isInvalid={fieldTypesError}
            errorMessage={t(messages.fieldTypesError)}
            isRequired
          />
          <TextAreaField
            label={t(messages.fieldHelp)}
            value={description}
            onChange={setDescription}
          />
          <Select
            label={t(messages.fieldset)}
            selectedKey={fieldset}
            onSelectionChange={(key) => key && setFieldset(String(key))}
            items={schema.fieldsets.filter(holdsCustomFields).map((entry) => ({
              label: entry.title,
              value: entry.id,
            }))}
          />
          <Switch isSelected={required} onChange={setRequired}>
            {t(messages.required)}
          </Switch>
          <div className="flex justify-end gap-2">
            <Button onPress={() => onOpenChange(false)}>
              {t(messages.cancel)}
            </Button>
            <Button
              type="submit"
              variant="primary"
              accent
              isDisabled={!isValid}
            >
              {t(messages.add)}
            </Button>
          </div>
        </Form>
      </Dialog>
    </Modal>
  );
}

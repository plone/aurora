import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Form } from 'react-aria-components';
import { Button, Dialog, Heading, Modal, TextField } from '@plone/quanta';
import { useTranslate } from '../../../provider/ControlPanelsProvider';
import { messages } from '../../messages';
import { addFieldset, isNameTaken } from '../../schemaEditing';
import { isValidShortName, toShortName } from '../../shortName';
import type { TypeSchema } from '../../types';

export interface AddFieldsetDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  schema: TypeSchema;
  /** Called with the schema with the new fieldset, and the fieldset's id. */
  onAdd: (schema: TypeSchema, fieldset: string) => void;
}

/** The dialog that adds a fieldset to the type. */
export function AddFieldsetDialog({
  isOpen,
  onOpenChange,
  schema,
  onAdd,
}: AddFieldsetDialogProps) {
  const t = useTranslate();
  const [name, setName] = useState('');
  const [shortName, setShortName] = useState('');
  const [shortNameEdited, setShortNameEdited] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setName('');
    setShortName('');
    setShortNameEdited(false);
  }, [isOpen]);

  const effectiveShortName = shortNameEdited ? shortName : toShortName(name);
  const shortNameError = !effectiveShortName
    ? undefined
    : !isValidShortName(effectiveShortName)
      ? t(messages.shortNameInvalid)
      : isNameTaken(schema, effectiveShortName)
        ? t(messages.nameTaken)
        : undefined;
  const isValid =
    name.trim() !== '' && effectiveShortName !== '' && !shortNameError;

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isValid) return;
    onAdd(
      addFieldset(schema, { id: effectiveShortName, title: name.trim() }),
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
              {t(messages.addFieldsetTitle)}
            </Heading>
            <p className="text-sm text-quanta-pigeon">
              {t(messages.addFieldsetDescription)}
            </p>
          </div>
          <TextField
            label={t(messages.name)}
            value={name}
            onChange={setName}
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

import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Form } from 'react-aria-components';
import {
  Button,
  Dialog,
  Heading,
  Modal,
  Radio,
  RadioGroup,
  Select,
  TextAreaField,
  TextField,
} from '@plone/quanta';
import {
  useNotify,
  useTranslate,
} from '../../../provider/ControlPanelsProvider';
import { useContentTypesDriver } from '../../driver';
import { messages } from '../../messages';
import { isValidShortName, toShortName } from '../../shortName';
import type { ContentTypeSummary } from '../../types';

export interface AddContentTypeDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  /** The existing types: their short names are taken, and they can be copied. */
  types: ContentTypeSummary[];
  /** Preselects "a copy of an existing type", with this type. */
  copyFrom?: string;
  /** Called with the new type, e.g. to go to its Fields tab. */
  onCreated: (type: ContentTypeSummary) => void;
}

/**
 * The dialog that creates a content type, blank or as a copy of another one.
 * The short name follows the name until it's edited.
 */
export function AddContentTypeDialog({
  isOpen,
  onOpenChange,
  types,
  copyFrom,
  onCreated,
}: AddContentTypeDialogProps) {
  const t = useTranslate();
  const notify = useNotify();
  const driver = useContentTypesDriver();
  const canCopy = driver.capabilities.copyType;

  const [name, setName] = useState('');
  const [shortName, setShortName] = useState('');
  const [shortNameEdited, setShortNameEdited] = useState(false);
  const [description, setDescription] = useState('');
  const [startFrom, setStartFrom] = useState<'blank' | 'copy'>('blank');
  const [source, setSource] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>();

  // Start fresh every time the dialog opens.
  useEffect(() => {
    if (!isOpen) return;
    setName('');
    setShortName('');
    setShortNameEdited(false);
    setDescription('');
    setStartFrom(canCopy && copyFrom ? 'copy' : 'blank');
    setSource(copyFrom ?? null);
    setSubmitError(undefined);
  }, [isOpen, copyFrom, canCopy]);

  const effectiveShortName = shortNameEdited ? shortName : toShortName(name);
  const taken = types.some((type) => type.id === effectiveShortName);
  const shortNameError = !effectiveShortName
    ? undefined
    : !isValidShortName(effectiveShortName)
      ? t(messages.shortNameInvalid)
      : taken
        ? t(messages.shortNameTaken)
        : undefined;
  const copyable = types.filter((type) => type.kind === 'dexterity');
  const isValid =
    name.trim() !== '' &&
    effectiveShortName !== '' &&
    !shortNameError &&
    (startFrom === 'blank' || source !== null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isValid || isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError(undefined);
    try {
      const created = await driver.createType({
        title: name.trim(),
        id: effectiveShortName,
        description: description.trim() || undefined,
        copyFrom: startFrom === 'copy' && source ? source : undefined,
      });
      notify({
        title: t(messages.created, { title: created.title }),
        variant: 'success',
      });
      onOpenChange(false);
      onCreated(created);
    } catch (error) {
      setSubmitError(
        error instanceof Error && error.message
          ? error.message
          : t(messages.createError),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} isDismissable>
      <Dialog className="mx-auto w-full p-8">
        <Form onSubmit={onSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <Heading slot="title" className="text-xl font-semibold">
              {t(messages.addTitle)}
            </Heading>
            <p className="text-sm text-quanta-pigeon">
              {t(messages.addDescription)}
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
            description={t(messages.shortNameHelp)}
            isInvalid={!!shortNameError}
            errorMessage={shortNameError}
            isRequired
          />
          <TextAreaField
            label={t(messages.typeDescription)}
            value={description}
            onChange={setDescription}
          />
          {canCopy && (
            <RadioGroup
              label={t(messages.startFrom)}
              value={startFrom}
              onChange={(value) => setStartFrom(value as 'blank' | 'copy')}
            >
              <Radio value="blank" description={t(messages.startBlankHelp)}>
                {t(messages.startBlank)}
              </Radio>
              <Radio value="copy" description={t(messages.startCopyHelp)}>
                {t(messages.startCopy)}
              </Radio>
            </RadioGroup>
          )}
          {canCopy && startFrom === 'copy' && (
            <Select
              label={t(messages.typeToCopy)}
              selectedKey={source}
              onSelectionChange={(key) => setSource(key ? String(key) : null)}
              items={copyable.map((type) => ({
                label: type.title,
                value: type.id,
              }))}
              isRequired
            />
          )}
          {submitError && (
            <p role="alert" className="text-sm text-quanta-candy">
              {submitError}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button onPress={() => onOpenChange(false)}>
              {t(messages.cancel)}
            </Button>
            <Button
              type="submit"
              variant="primary"
              accent
              isDisabled={!isValid}
              isPending={isSubmitting}
            >
              {t(messages.create)}
            </Button>
          </div>
        </Form>
      </Dialog>
    </Modal>
  );
}

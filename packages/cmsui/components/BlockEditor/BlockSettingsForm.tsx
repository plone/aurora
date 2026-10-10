import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FormProvider,
  isDeepEqual,
  setByPath,
  useFormStore,
} from '@plone/helpers';
import type { BlockConfigBase } from '@plone/types';
import BlockSettingsFormRenderer from './BlockSettingsFormRenderer';
import { buildSchemaValidators } from '../Form/validation';

type BlockSettingsFormProps = {
  schema: BlockConfigBase['blockSchema'];
  formData?: Record<string, unknown>;
  onFormDataChange?: (next: Record<string, unknown>) => void;
};

/**
 * The settings form of the selected block. The block's data lives in the
 * Plate node: the form starts from it, writes every change back with
 * `onFormDataChange`, and starts over when the node changes outside the form
 * (for example, on undo).
 */
const BlockSettingsForm = (props: BlockSettingsFormProps) => {
  const { schema: schemaProp, formData = {}, onFormDataChange } = props;

  const schema =
    typeof schemaProp === 'function'
      ? // TODO: use i18n
        (schemaProp as any)({
          props,
          formData: formData as any,
          intl: undefined as any,
        })
      : schemaProp;

  const { t } = useTranslation();
  // Validators registered for this block type (`blockType` + `fieldName`)
  // apply too.
  const blockType = formData['@type'] as string | undefined;
  const validators = useMemo(
    () => buildSchemaValidators(schema ?? { properties: {} }, { t, blockType }),
    // The sidebar remounts this form for each block.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // The sidebar remounts this form for each block.
  const form = useFormStore<Record<string, unknown>>({
    key: 'block-settings',
    initialValues: formData,
    validators,
    onValuesChange: onFormDataChange,
  });

  useEffect(() => {
    if (isDeepEqual(form.getValues(), formData)) return;
    form.reset(formData);
  }, [form, formData]);

  return (
    <FormProvider form={form}>
      <BlockSettingsFormRenderer
        schema={schema as any}
        getFieldProps={(fieldName) => ({
          setValue: (value: unknown) => {
            let nextData = setByPath(form.getValues(), fieldName, value);

            // A field's schema may declare side effects on other fields when
            // it changes, via `onChangeSideEffects(value, nextData)` returning
            // a map of `fieldName -> value` patches. This is the single place
            // block fields can react to each other (eg. coupling alignment and
            // size). The change and its side effects are written at once.
            const fieldSchema = (schema as any)?.properties?.[fieldName];
            const sideEffects = fieldSchema?.onChangeSideEffects?.(
              value,
              nextData,
            );
            if (sideEffects) {
              for (const [key, patchValue] of Object.entries(sideEffects)) {
                nextData = setByPath(nextData, key, patchValue);
              }
            }

            form.setValues(nextData);
          },
        })}
      />
    </FormProvider>
  );
};

export default BlockSettingsForm;

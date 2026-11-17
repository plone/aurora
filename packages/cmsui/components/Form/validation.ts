import config from '@plone/registry';
import type {
  FieldValidationResult,
  FieldValidator,
  NestedFieldErrors,
} from '@plone/helpers';
import type { FieldSchema, ValidatorUtility } from '@plone/types';
import {
  resolveItemSchema,
  type ItemSchema,
  type ItemSchemaEnhancer,
  type ObjectListItem,
} from '../ObjectListWidget/objectList';

type Translate = (key: string, options?: Record<string, unknown>) => string;

export type ValidatedSchema = {
  properties: Record<string, FieldSchema>;
  required?: string[];
};

/**
 * Whether a value counts as empty for the required rule. Empty values skip
 * the other validators.
 */
export const isEmptyValue = (field: FieldSchema, value: unknown): boolean => {
  if (value === undefined || value === null || value === '') return true;
  if (Array.isArray(value)) return value.length === 0;
  if (field.widget === 'richtext' && typeof value === 'object') {
    const html = (value as { data?: string }).data ?? '';
    return html.replace(/<[^>]+>/g, '').trim().length === 0;
  }
  return false;
};

/**
 * The validators registered for a field, as `validator` utilities matched
 * by their dependencies:
 *
 * - `format`: the field's `format` (or its tagged values' `format`)
 * - `fieldType`: the field's `type` (`string` by default)
 * - `widget`: the field's widget (or its tagged values' widget)
 * - `behaviorName` + `fieldName`: a field of a behavior
 * - `blockType` + `fieldName`: a field of a block's settings
 */
export function getFieldValidators(
  field: FieldSchema,
  fieldName: string,
  { blockType }: { blockType?: string } = {},
): ValidatorUtility[] {
  const frontendOptions = field.widgetOptions?.frontendOptions as
    { widget?: string; format?: string } | undefined;
  const lookups: Array<Record<string, string>> = [];

  const format = frontendOptions?.format ?? (field.format as string);
  if (format) lookups.push({ format });
  lookups.push({ fieldType: field.type ?? 'string' });
  const widget = frontendOptions?.widget ?? field.widget;
  if (widget) lookups.push({ widget });
  if (typeof field.behavior === 'string') {
    lookups.push({ behaviorName: field.behavior, fieldName });
  }
  if (blockType) lookups.push({ blockType, fieldName });

  return lookups.flatMap((dependencies) =>
    config
      .getUtilities({ type: 'validator', dependencies })
      .map((utility) => utility.method as ValidatorUtility),
  );
}

// The widgets whose value holds fields of their own, described by an item
// schema: `object` (one object) and `object_list` (a list of objects).
const NESTED_WIDGETS = new Set(['object', 'object_list']);

/**
 * A validator's result, as errors by path relative to its field, with `prefix`
 * in front: the errors of an item's field, inside the list.
 */
const nestedErrors = (
  prefix: string,
  result: FieldValidationResult,
): NestedFieldErrors => {
  const entries: Array<[string, string | string[] | null | undefined]> =
    result && typeof result === 'object' && !Array.isArray(result)
      ? Object.entries(result).map(([relative, messages]) => [
          relative && prefix ? `${prefix}.${relative}` : relative || prefix,
          messages,
        ])
      : [[prefix, result]];
  // Fields without errors are left out.
  return Object.fromEntries(
    entries.filter((entry): entry is [string, string | string[]] =>
      Array.isArray(entry[1]) ? entry[1].length > 0 : !!entry[1],
    ),
  );
};

/**
 * Validates the fields of the objects that an `object` or `object_list`
 * field holds, with the validators of its item schema. Returns their errors
 * by path relative to the field, such as `2.title`.
 */
function buildItemsValidator(
  field: FieldSchema,
  widget: string,
  t: Translate,
): (value: unknown) => NestedFieldErrors {
  // The widget gets the field's schema as `schema`, and its options.
  const schema = resolveItemSchema({ ...field, schema: field });
  const enhancer =
    typeof field.schemaEnhancer === 'function'
      ? (field.schemaEnhancer as ItemSchemaEnhancer)
      : undefined;
  const validators = buildSchemaValidators<ObjectListItem>(schema, { t });
  const validatorsFor = (item: ObjectListItem) =>
    enhancer
      ? buildSchemaValidators<ObjectListItem>(
          enhancer({ schema, formData: item, t }) as ItemSchema,
          { t },
        )
      : validators;

  const validateItem = (item: ObjectListItem, prefix: string) =>
    Object.entries(validatorsFor(item)).reduce<NestedFieldErrors>(
      (errors, [fieldName, validate]) =>
        Object.assign(
          errors,
          nestedErrors(
            prefix ? `${prefix}.${fieldName}` : fieldName,
            validate(item[fieldName], item),
          ),
        ),
      {},
    );

  return (value) => {
    if (widget === 'object') {
      return value && typeof value === 'object'
        ? validateItem(value as ObjectListItem, '')
        : validateItem({}, '');
    }
    if (!Array.isArray(value)) return {};
    return value.reduce<NestedFieldErrors>(
      (errors, item, index) =>
        Object.assign(
          errors,
          validateItem((item ?? {}) as ObjectListItem, String(index)),
        ),
      {},
    );
  };
}

/**
 * Builds the validators of a schema's fields, for `useFormStore`.
 *
 * A required field must not be empty (booleans and read-only fields are not
 * checked). A non-empty value is checked by every validator registered for
 * the field (see `getFieldValidators`). Add-ons add validators by
 * registering `validator` utilities.
 *
 * The fields of an `object` or `object_list` field are validated with its
 * item schema, the same way: their errors show on the fields of each item,
 * at paths such as `<field>.2.title`.
 */
export function buildSchemaValidators<T>(
  schema: ValidatedSchema,
  { t, blockType }: { t: Translate; blockType?: string },
): Record<string, FieldValidator<T>> {
  const required = new Set(schema.required ?? []);
  // Validators written for Volto translate with react-intl's formatMessage.
  const formatMessage = (
    message: { id: string; defaultMessage?: string } | string,
    values?: Record<string, unknown>,
  ) =>
    typeof message === 'string'
      ? t(message, values)
      : t(message.id, { defaultValue: message.defaultMessage, ...values });

  return Object.fromEntries(
    Object.entries(schema.properties).map(([fieldName, schemaField]) => {
      // Like the widget, the validators see the tagged values' widget props.
      const field: FieldSchema = {
        ...schemaField,
        ...((schemaField.widgetOptions?.frontendOptions as any)?.widgetProps ??
          {}),
      };
      const checkRequired =
        required.has(fieldName) && field.type !== 'boolean' && !field.readonly;
      const validators = getFieldValidators(field, fieldName, { blockType });
      const widget =
        ((field.widgetOptions?.frontendOptions as { widget?: string })
          ?.widget as string | undefined) ?? field.widget;
      const validateItems =
        widget && NESTED_WIDGETS.has(widget) && !field.readonly
          ? buildItemsValidator(field, widget, t)
          : undefined;

      const validateField = (value: unknown, values: T) => {
        if (isEmptyValue(field, value)) {
          return checkRequired ? t('cmsui.validation.required') : undefined;
        }
        return validators
          .map((validator) =>
            validator({
              value,
              field,
              fieldName,
              formData: values,
              t,
              formatMessage,
            }),
          )
          .filter((message): message is string => !!message);
      };

      const validate: FieldValidator<T> = validateItems
        ? (value, values) => ({
            ...nestedErrors('', validateField(value, values)),
            ...validateItems(value),
          })
        : validateField;
      return [fieldName, validate];
    }),
  );
}

// plone.restapi returns field errors as a Python repr of a list of dicts:
// "[{'message': 'Invalid date', 'field': 'effective', 'error': ...}]".
// A string that contains an apostrophe is quoted with double quotes.
const QUOTED = `'((?:[^'\\\\]|\\\\.)*)'|"((?:[^"\\\\]|\\\\.)*)"`;
const entryPattern = (key: string) =>
  new RegExp(`['"]${key}['"]\\s*:\\s*(?:${QUOTED})`);

/**
 * Maps the validation errors of a plone.restapi `BadRequest` response
 * (its `message`) to field names. Returns an empty object when the message
 * has no field errors.
 */
export function parseServerValidationErrors(
  message: unknown,
): Record<string, string[]> {
  if (typeof message !== 'string') return {};
  const errors: Record<string, string[]> = {};

  for (const [item] of message.matchAll(/\{[^{}]*\}/g)) {
    const fieldMatch = item.match(entryPattern('field'));
    const messageMatch = item.match(entryPattern('message'));
    const field = fieldMatch?.[1] ?? fieldMatch?.[2];
    const text = messageMatch?.[1] ?? messageMatch?.[2];
    if (field && text) (errors[field] ??= []).push(text);
  }
  return errors;
}

/**
 * The first field with errors, in the order the schema's fieldsets show
 * them.
 */
export const firstInvalidField = (
  schema: { fieldsets: Array<{ fields: string[] }> },
  errors: Record<string, unknown>,
): string | undefined => {
  const paths = Object.keys(errors);
  for (const name of schema.fieldsets.flatMap((fieldset) => fieldset.fields)) {
    // The field itself, or a field inside it, such as `links.2.title`.
    const path = paths.find(
      (candidate) => candidate === name || candidate.startsWith(`${name}.`),
    );
    if (path) return path;
  }
  return paths[0];
};

/**
 * Focuses a field's input by its name. The field may only render after the
 * caller switched tabs or opened a fieldset, so it retries for a few frames.
 */
export const focusField = (name: string, attempts = 10) => {
  if (typeof document === 'undefined') return;
  const element = document.querySelector<HTMLElement>(
    `[name="${CSS.escape(name)}"]`,
  );
  if (element) {
    element.focus();
  } else if (attempts > 0) {
    requestAnimationFrame(() => focusField(name, attempts - 1));
  }
};

/**
 * The field errors of a failed plone.restapi request, if it failed because
 * of validation (a 400 `BadRequest` with field errors). Save actions return
 * them to the form instead of failing.
 */
export const getServerValidationErrors = (
  error: unknown,
): Record<string, string[]> | undefined => {
  const { status, data } = (error ?? {}) as {
    status?: number;
    data?: { message?: unknown };
  };
  if (status !== 400) return undefined;
  const errors = parseServerValidationErrors(data?.message);
  return Object.keys(errors).length > 0 ? errors : undefined;
};

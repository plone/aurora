import { useEffect } from 'react';
import config from '@plone/registry';
import type {
  Content,
  FieldSchema,
  FormWidgetProps,
  WidgetOptions,
} from '@plone/types';
import { useFieldFocusedAtom } from '@plone/helpers';
import { useFieldContext } from './Form';
import { type PrimitiveAtom } from 'jotai';
import { type DeepKeys } from '@tanstack/react-form';

interface BaseFieldProps {
  /** The field's name in the form data. */
  name: string;
  /** The field's schema property. */
  schema: FieldSchema;
  value: unknown;
  required?: boolean;
  /** The field's validation errors, as the form reports them. */
  errors?: Array<unknown>;
  className?: string;
  /** Called with the next value, in addition to updating the form. */
  onChange?: (value: any) => void;
  onBlur?: () => void;
}

type AtomFieldProps = BaseFieldProps & {
  formAtom: PrimitiveAtom<Content>;
};

type FormFieldProps = BaseFieldProps & {
  formAtom?: undefined;
};

export type FieldProps = AtomFieldProps | FormFieldProps;

/** What the widget lookup reads: the field schema and the field's name. */
type ResolvableField = FieldSchema & { name: string };

const MODE_HIDDEN = 'hidden'; //hidden mode. If mode is hidden, field is not rendered
/**
 * Get default widget
 */
const getWidgetDefault = (): React.ComponentType<any> =>
  config.widgets?.default;

/**
 * Get widget by field's `id` attribute
 */
const getWidgetByFieldId = (
  id: ResolvableField['name'],
): React.ComponentType<any> | null =>
  typeof id === 'string' ? (config.getWidget(id, 'id') ?? null) : null;

/**
 * Get widget by factory attribute
 */
const getWidgetByFactory = (
  factory: ResolvableField['factory'],
): React.ComponentType<any> | null =>
  factory ? (config.getWidget(factory, 'factory') ?? null) : null;

/**
 * Get widget by field's `widget` attribute. An unknown widget name does not
 * stop the lookup, so the field can still resolve by its choices, vocabulary,
 * factory or type.
 */
const getWidgetByName = (
  widget: ResolvableField['widget'],
): React.ComponentType<any> | null =>
  typeof widget === 'string'
    ? (config.getWidget(widget, 'widget') ?? null)
    : null;

/**
 * Get widget by tagged values
 *

directives.widget(
    'fieldname',
    frontendOptions={
        "widget": 'specialwidget',
        "version": 'extra'
    })

 */
const getWidgetFromTaggedValues = (
  widgetOptions?: WidgetOptions,
): React.ComponentType<any> | null =>
  typeof widgetOptions?.frontendOptions?.widget === 'string'
    ? (config.getWidget(widgetOptions.frontendOptions.widget, 'widget') ?? null)
    : null;

/**
 * Get widget props from tagged values
 *

directives.widget(
    "fieldname",
    frontendOptions={
        "widget": "specialwidget",
        "widgetProps": {"prop1": "specialprop"}
    })

 */
const getWidgetPropsFromTaggedValues = (
  widgetOptions?: WidgetOptions,
): Record<string, unknown> | null =>
  typeof widgetOptions?.frontendOptions?.widgetProps === 'object'
    ? widgetOptions.frontendOptions.widgetProps
    : null;

/**
 * Get widget by field's `vocabulary` attribute
 */
const getWidgetByVocabulary = (
  vocabulary: ResolvableField['vocabulary'],
): React.ComponentType<any> | null => {
  const vocabId = vocabulary?.['@id'];
  if (!vocabId) return null;

  const key = vocabId.replace(/^.*\/@vocabularies\//, '');
  return config.getWidget(key, 'vocabulary') ?? null;
};

/**
 * Get widget by field's hints `vocabulary` attribute in widgetOptions
 */
const getWidgetByVocabularyFromHint = (
  props: ResolvableField,
): React.ComponentType<any> | null => {
  const vocabId = props.widgetOptions?.vocabulary?.['@id'];
  if (!vocabId) return null;

  const key = vocabId.replace(/^.*\/@vocabularies\//, '');
  return config.getWidget(key, 'vocabulary') ?? null;
};

/**
 * Get widget by field's `choices` attribute
 */
const getWidgetByChoices = (
  props: ResolvableField,
): React.ComponentType<any> | null =>
  props.choices || props.vocabulary ? (config.widgets?.choices ?? null) : null;

/**
 * Get widget by field's `type` attribute
 */
const getWidgetByType = (
  type: ResolvableField['type'],
): React.ComponentType<any> | null =>
  type ? (config.getWidget(type, 'type') ?? null) : null;

/**
 * Schema keys that the form turns into widget contract props, or that only
 * the form uses. They are not passed to the widget as they are.
 */
const RESERVED_SCHEMA_KEYS = new Set([
  'title',
  'description',
  'type',
  'default',
  'widget',
  'factory',
  'readonly',
  'required',
  'choices',
  'vocabulary',
  'widgetOptions',
  'onChangeSideEffects',
  // JSON schema validation keywords, read from `schema` when needed.
  'items',
  'minLength',
  'maxLength',
  'minimum',
  'maximum',
  'pattern',
  'format',
  'additionalItems',
  'uniqueItems',
]);

/**
 * Builds the props a widget receives from the field's schema and state.
 *
 * Schema keys the form understands become widget contract props (see
 * `FormWidgetProps`). Any other key of the field schema is a widget option,
 * such as `actions` for the align widget, and is passed as is. Widget props
 * from the tagged values (`frontendOptions.widgetProps`) come last.
 */
export const buildWidgetProps = ({
  name,
  schema,
  value,
  required,
  errors,
  className,
}: Omit<BaseFieldProps, 'onChange' | 'onBlur'>): Omit<
  FormWidgetProps,
  'onChange' | 'onBlur'
> &
  Record<string, unknown> => {
  const widgetOptions = Object.fromEntries(
    Object.entries(schema).filter(([key]) => !RESERVED_SCHEMA_KEYS.has(key)),
  );
  const messages = (errors ?? []).filter(Boolean).map((error) => String(error));

  return {
    ...widgetOptions,
    name,
    value: value as FormWidgetProps['value'],
    defaultValue: schema.default as FormWidgetProps['defaultValue'],
    label: schema.title,
    description: schema.description,
    required: !!required,
    readOnly: !!schema.readonly,
    invalid: messages.length > 0,
    errorMessage: messages.length > 0 ? messages.join(', ') : undefined,
    className,
    choices: schema.choices,
    vocabulary: schema.vocabulary,
    widgetOptions: schema.widgetOptions,
    schema,
    ...getWidgetPropsFromTaggedValues(schema.widgetOptions),
  };
};

const renderFieldWidget = ({
  fieldProps,
  onFieldChange,
  onFieldBlur,
}: {
  fieldProps: FieldProps;
  onFieldChange: (value: any) => void;
  onFieldBlur: () => void;
}) => {
  const { schema, name } = fieldProps;
  if (schema.mode === MODE_HIDDEN) return null;

  const field: ResolvableField = { ...schema, name };
  const Widget =
    getWidgetByFieldId(name) ||
    getWidgetFromTaggedValues(schema.widgetOptions) ||
    getWidgetByName(schema.widget) ||
    getWidgetByChoices(field) ||
    getWidgetByVocabulary(schema.vocabulary) ||
    getWidgetByVocabularyFromHint(field) ||
    getWidgetByFactory(schema.factory) ||
    getWidgetByType(schema.type) ||
    getWidgetDefault();

  return (
    <Widget
      {...buildWidgetProps(fieldProps)}
      onChange={(value: any) => {
        fieldProps.onChange?.(value);
        onFieldChange(value);
      }}
      onBlur={() => {
        fieldProps.onBlur?.();
        onFieldBlur();
      }}
    />
  );
};

const AtomField = (props: AtomFieldProps) => {
  const field = useFieldContext();
  const value = field.state.value;

  const [fieldValue, setField] = useFieldFocusedAtom<
    Content,
    DeepKeys<Content>
  >(props.formAtom, props.name as DeepKeys<Content>);

  // atom -> form (programmatic update; runs TanStack Form’s flow)
  useEffect(() => {
    if (fieldValue !== value) {
      // prefer handleChange to keep validators/touched consistent
      field.handleChange(fieldValue as typeof value);
    }
  }, [fieldValue, value, field]);

  return renderFieldWidget({
    fieldProps: props,
    onFieldBlur: () => field.handleBlur(),
    onFieldChange: (value: any) => {
      setField(value);
      return field.handleChange(value);
    },
  });
};

const FormField = (props: FormFieldProps) => {
  const field = useFieldContext();

  return renderFieldWidget({
    fieldProps: props,
    onFieldBlur: () => field.handleBlur(),
    onFieldChange: (value: any) => field.handleChange(value),
  });
};

const Field = (props: FieldProps) => {
  if ('formAtom' in props && props.formAtom) {
    return <AtomField {...props} />;
  }

  return <FormField {...props} />;
};

export default Field;

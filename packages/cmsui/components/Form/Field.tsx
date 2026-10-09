import config from '@plone/registry';
import type { FieldSchema, FormWidgetProps, WidgetOptions } from '@plone/types';
import { useSchemaField } from '@plone/helpers';

/** The values `buildWidgetProps` builds the widget props from. */
interface WidgetPropsSource {
  /** The field's name in the form data. */
  name: string;
  /** The field's schema property. */
  schema: FieldSchema;
  value: unknown;
  required?: boolean;
  /** The field's validation errors, as the form reports them. */
  errors?: Array<unknown>;
  className?: string;
}

export interface FieldProps {
  /** The field's name (path) in the form data. */
  name: string;
  /** The field's schema property. */
  schema: FieldSchema;
  required?: boolean;
  className?: string;
  /** Called with the next value, in addition to updating the form. */
  onChange?: (value: any) => void;
  /**
   * Writes the next value instead of the form's default write. Block settings
   * use it to apply side effects on other fields in the same change.
   */
  setValue?: (value: any) => void;
  onBlur?: () => void;
}

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
}: WidgetPropsSource): Omit<FormWidgetProps, 'onChange' | 'onBlur'> &
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

/**
 * Renders the widget of one schema field of the current form.
 *
 * It reads the field's value and state from the form (`useSchemaField`),
 * resolves the widget from the field schema, and passes it the widget
 * contract.
 */
const SchemaField = (props: FieldProps) => {
  const { name, schema, required, className } = props;
  const field = useSchemaField(name);

  if (schema.mode === MODE_HIDDEN) return null;

  const resolvable: ResolvableField = { ...schema, name };
  const Widget =
    getWidgetByFieldId(name) ||
    getWidgetFromTaggedValues(schema.widgetOptions) ||
    getWidgetByName(schema.widget) ||
    getWidgetByChoices(resolvable) ||
    getWidgetByVocabulary(schema.vocabulary) ||
    getWidgetByVocabularyFromHint(resolvable) ||
    getWidgetByFactory(schema.factory) ||
    getWidgetByType(schema.type) ||
    getWidgetDefault();

  return (
    <Widget
      {...buildWidgetProps({
        name,
        schema,
        value: field.value,
        required,
        errors: field.meta.errors,
        className,
      })}
      onChange={(value: any) => {
        props.onChange?.(value);
        if (props.setValue) props.setValue(value);
        else field.onChange(value);
      }}
      onBlur={() => {
        props.onBlur?.();
        field.onBlur();
      }}
    />
  );
};

export default SchemaField;

export type WidgetChoice = [value: string, label: string];

export type WidgetVocabulary = {
  '@id': string;
};

export type WidgetOptions = Record<string, unknown> & {
  frontendOptions?: {
    widget?: string;
    widgetProps?: Record<string, unknown>;
  };
  vocabulary?: WidgetVocabulary;
};

/**
 * A field's schema property, as plone.restapi or a block schema describes it.
 */
export type FieldSchema = Record<string, unknown> & {
  title?: string;
  description?: string;
  type?: string;
  default?: unknown;
  widget?: string;
  factory?: string;
  readonly?: boolean;
  mode?: string;
  choices?: WidgetChoice[];
  vocabulary?: WidgetVocabulary;
  widgetOptions?: WidgetOptions;
};

/**
 * The props every form widget receives: the widget contract.
 *
 * The form builds them from the field's schema and state. Any other key of
 * the field schema is passed to the widget as is, as a widget option.
 */
export interface FormWidgetProps<TValue = unknown> {
  /** The field's name in the form data. */
  name: string;
  /** The stored value. It can be empty when the content has no value yet. */
  value?: TValue | null;
  /** The schema's default value. */
  defaultValue?: TValue | null;
  /** Emits the next value, in the shape the content API expects. */
  onChange: (value: TValue) => void;
  onBlur?: () => void;
  label?: string;
  description?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  /** Whether the field has validation errors. */
  invalid?: boolean;
  /** The field's validation errors, as one message. */
  errorMessage?: string;
  className?: string;
  choices?: WidgetChoice[];
  vocabulary?: WidgetVocabulary;
  widgetOptions?: WidgetOptions;
  /** The raw field schema, for widgets that need more than the contract. */
  schema?: FieldSchema;
}

export type FormWidget<TValue = unknown> = React.ComponentType<
  FormWidgetProps<TValue>
>;

export type WidgetIdsTypes =
  | (string & {})
  | 'schema'
  | 'subjects'
  | 'query'
  | 'recurrence'
  | 'remoteUrl'
  | 'id'
  | 'site_logo'
  | 'preview_image_link';

export type WidgetsConfigById<
  K extends WidgetIdsTypes = WidgetIdsTypes,
  P = any,
> = Partial<{
  [id in K]: React.ComponentType<P>;
}> & {
  [custom: string]: React.ComponentType<P>;
};

export type WidgetByWidgetTypes =
  | (string & {})
  | 'textarea'
  | 'datetime'
  | 'date'
  | 'password'
  | 'file'
  | 'image'
  | 'align'
  | 'buttons'
  | 'url'
  | 'internal_url'
  | 'email'
  | 'array'
  | 'token'
  | 'query'
  | 'query_sort_on'
  | 'querystring'
  | 'object_browser'
  | 'object'
  | 'object_list'
  | 'vocabularyterms'
  | 'image_size'
  | 'select_querystring_field'
  | 'autocomplete'
  | 'color_picker'
  | 'select'
  | 'schema'
  | 'static_text'
  | 'hidden'
  | 'radio_group'
  | 'checkbox_group'
  | 'blockAlignment'
  | 'blockWidth'
  | 'size';

export type WidgetsConfigByWidget<
  K extends WidgetByWidgetTypes = WidgetByWidgetTypes,
  P = any,
> = Partial<{
  [widgetType in K]: React.ComponentType<P>;
}>;

export type WidgetVocabularyTypes =
  (string & {}) | 'plone.app.vocabularies.Catalog';

export type WidgetsConfigByVocabulary<
  K extends WidgetVocabularyTypes = WidgetVocabularyTypes,
  P = any,
> = Partial<{
  [vocabularyName in K]: React.ComponentType<P>;
}>;

export type WidgetFactortTypes =
  (string & {}) | 'Relation List' | 'Relation Choice';

export type WidgetsConfigByFactory<
  K extends WidgetFactortTypes = WidgetFactortTypes,
  P = any,
> = Partial<{
  [factoryName in K]: React.ComponentType<P>;
}>;

export type WidgetByTypeTypes =
  | (string & {})
  | 'boolean'
  | 'array'
  | 'object'
  | 'date'
  | 'datetime'
  | 'password'
  | 'number'
  | 'integer'
  | 'id';

export type WidgetsConfigByType<
  K extends WidgetByTypeTypes = WidgetByTypeTypes,
  P = any,
> = Partial<{
  [widgetType in K]: React.ComponentType<P>;
}>;
export type WidgetViewsIdTypes =
  (string & {}) | 'file' | 'image' | 'relatedItems' | 'subjects';

export type WidgetsConfigViewById<
  K extends WidgetViewsIdTypes = WidgetViewsIdTypes,
  P = any,
> = Partial<{
  [viewId in K]: React.ComponentType<P>;
}>;

export type WidgetByViewTypes =
  | (string & {})
  | 'array'
  | 'boolean'
  | 'choices'
  | 'date'
  | 'datetime'
  | 'password'
  | 'description'
  | 'email'
  | 'file'
  | 'image'
  | 'password'
  | 'relation'
  | 'richtext'
  | 'string'
  | 'tags'
  | 'textarea'
  | 'title'
  | 'url'
  | 'internal_url'
  | 'object';

export type WidgetsConfigViewByWidget<
  K extends WidgetByViewTypes = WidgetByViewTypes,
  P = any,
> = Partial<{
  [widgetTypeByView in K]: React.ComponentType<P>;
}>;

export type WidgetViewByTypeTypes = (string & {}) | 'array' | 'boolean';

export type WidgetsConfigViewByType<
  K extends WidgetViewByTypeTypes = WidgetViewByTypeTypes,
  P = any,
> = Partial<{
  [viewByType in K]: React.ComponentType<P>;
}>;

export interface WidgetsConfigViews<P = any> {
  // getWidget: React.ComponentType<P>;
  default: React.ComponentType<P>;
  id: WidgetsConfigViewById;
  widget: WidgetsConfigViewByWidget;
  vocabulary: {};
  choices: React.ComponentType<P>;
  type: WidgetsConfigViewByType;
}

export interface WidgetsConfig {
  default: React.ComponentType<any>;
  id: WidgetsConfigById;
  widget: WidgetsConfigByWidget;
  vocabulary: WidgetsConfigByVocabulary;
  factory: WidgetsConfigByFactory;
  choices: React.ComponentType<any>;
  type: WidgetsConfigByType;
  views: WidgetsConfigViews;
}

export type NestedKeys<T> = {
  [K in keyof T]: T[K] extends Record<string, React.ComponentType<any>>
    ? K
    : never;
}[keyof T];

export type WidgetKey = NestedKeys<WidgetsConfig>;

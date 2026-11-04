import { useId, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { twMerge } from 'tailwind-merge';
import { FormProvider } from '@plone/helpers';
import type { FormWidgetProps } from '@plone/types';
import {
  resolveItemSchema,
  type ItemSchemaEnhancer,
  type ItemSchemaSource,
  type ObjectListItem,
} from '../ObjectListWidget/objectList';
import { ObjectFields } from './ObjectFields';
import { useWidgetForm } from './useWidgetForm';

export type ObjectWidgetProps = FormWidgetProps<ObjectListItem | null> & {
  /** The name of a registered `schema` utility building the object's schema. */
  schemaName?: string;
  /** Enhances the object's schema from the object's values. */
  schemaEnhancer?: ItemSchemaEnhancer;
  /**
   * The field's schema, which holds the object's schema as `schema`, or the
   * object's schema itself, or a function that builds it.
   */
  schema?: FormWidgetProps['schema'] | ItemSchemaSource;
};

/**
 * Edits an object whose fields a schema describes, such as a link with a
 * title and a target. Each field gets the widget its schema asks for.
 *
 * Registered as `widget: 'object'`. The object's schema is the field's
 * `schema`, or a registered `schema` utility named by `schemaName`, as in
 * Volto.
 */
export function ObjectWidget(props: ObjectWidgetProps) {
  const {
    name,
    value,
    onChange,
    label,
    description,
    required,
    invalid,
    errorMessage,
    className,
    schemaEnhancer,
  } = props;
  const { t } = useTranslation();
  const labelId = useId();
  const descriptionId = useId();
  const form = useWidgetForm({ name, value: value ?? null, onChange });

  const baseSchema = useMemo(
    () => resolveItemSchema(props),
    // The schema only depends on where it comes from.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [props.schema, props.schemaName],
  );
  const schema = schemaEnhancer
    ? schemaEnhancer({ schema: baseSchema, formData: value ?? {}, t })
    : baseSchema;

  return (
    <div
      role="group"
      aria-labelledby={label ? labelId : undefined}
      aria-describedby={description ? descriptionId : undefined}
      data-required={required || undefined}
      data-invalid={invalid || undefined}
      className={twMerge('group flex flex-col gap-3', className)}
    >
      {label && (
        <span id={labelId} className="text-sm font-semibold text-quanta-iron">
          {label}
        </span>
      )}
      {description && (
        <span id={descriptionId} className="text-xs text-quanta-pigeon">
          {description}
        </span>
      )}
      <FormProvider form={form}>
        <ObjectFields schema={schema} path={name} />
      </FormProvider>
      {invalid && errorMessage && (
        <span className="text-xs text-quanta-candy">{errorMessage}</span>
      )}
    </div>
  );
}

ObjectWidget.displayName = 'ObjectWidget';

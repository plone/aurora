import {
  Accordion,
  AccordionItem,
  AccordionItemTrigger,
  AccordionPanel,
} from '@plone/quanta';
import type { FieldSchema } from '@plone/types';
import SchemaField, { type FieldProps } from './Field';

export type FieldsetsSchema = {
  fieldsets: Array<{ id: string; title: string; fields: string[] }>;
  properties: Record<string, FieldSchema>;
  required?: string[];
};

type SchemaFieldsetsProps = {
  /** The schema whose fieldsets and fields are rendered. */
  schema: FieldsetsSchema;
  /** Extra props for a field, for example an `onChange` listener. */
  getFieldProps?: (
    fieldName: string,
  ) => Partial<Pick<FieldProps, 'onChange' | 'setValue' | 'onBlur'>>;
  /**
   * `accordion` (the default) folds each fieldset, for narrow places like the
   * sidebar. `sections` lays them out one after the other, for a full page.
   */
  layout?: 'accordion' | 'sections';
};

/**
 * Renders a schema's fieldsets, and a widget for each of their fields.
 *
 * It must be rendered inside a `FormProvider`: each field reads and writes
 * its value in that form. Every schema-driven form (content, control panels,
 * block settings) renders its fields through this component, so they all
 * build the widget props the same way.
 */
const SchemaFieldsets = ({
  schema,
  getFieldProps,
  layout = 'accordion',
}: SchemaFieldsetsProps) => {
  const renderField = (fieldName: string, className?: string) => (
    <SchemaField
      key={fieldName}
      className={className}
      name={fieldName}
      schema={schema.properties[fieldName] ?? {}}
      required={schema.required?.includes(fieldName)}
      {...getFieldProps?.(fieldName)}
    />
  );

  if (layout === 'sections') {
    const fieldsets = schema.fieldsets.filter(
      (fieldset) => fieldset.fields.length > 0,
    );
    // A lone fieldset is the whole form: its title, often "Default", says
    // nothing.
    const showTitles = fieldsets.length > 1;
    return (
      <div className="flex flex-col">
        {fieldsets.map((fieldset) => (
          <section
            key={fieldset.id}
            aria-labelledby={showTitles ? `fieldset-${fieldset.id}` : undefined}
            className={`
              border-quanta-smoke
              not-first:mt-10 not-first:border-t not-first:pt-8
            `}
          >
            {showTitles && (
              <h2
                id={`fieldset-${fieldset.id}`}
                className="mb-5 text-lg leading-6 font-semibold text-quanta-denim"
              >
                {fieldset.title}
              </h2>
            )}
            <div className="flex flex-col gap-6">
              {fieldset.fields.map((fieldName) => renderField(fieldName))}
            </div>
          </section>
        ))}
      </div>
    );
  }

  return (
    <>
      {schema.fieldsets.map((fieldset) => (
        <Accordion defaultExpandedKeys={['default']} key={fieldset.id}>
          <AccordionItem id={fieldset.id}>
            <AccordionItemTrigger>{fieldset.title}</AccordionItemTrigger>
            <AccordionPanel>
              {fieldset.fields.map((fieldName) =>
                renderField(fieldName, 'mb-4'),
              )}
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
      ))}
    </>
  );
};

export default SchemaFieldsets;

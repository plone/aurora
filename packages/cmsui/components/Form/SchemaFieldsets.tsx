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
};

/**
 * Renders a schema's fieldsets, and a widget for each of their fields.
 *
 * It must be rendered inside a `FormProvider`: each field reads and writes
 * its value in that form. Every schema-driven form (content, control panels,
 * block settings) renders its fields through this component, so they all
 * build the widget props the same way.
 */
const SchemaFieldsets = ({ schema, getFieldProps }: SchemaFieldsetsProps) => (
  <>
    {schema.fieldsets.map((fieldset) => (
      <Accordion defaultExpandedKeys={['default']} key={fieldset.id}>
        <AccordionItem id={fieldset.id}>
          <AccordionItemTrigger>{fieldset.title}</AccordionItemTrigger>
          <AccordionPanel>
            {fieldset.fields.map((fieldName) => (
              <SchemaField
                key={fieldName}
                className="mb-4"
                name={fieldName}
                schema={schema.properties[fieldName] ?? {}}
                required={schema.required?.includes(fieldName)}
                {...getFieldProps?.(fieldName)}
              />
            ))}
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
    ))}
  </>
);

export default SchemaFieldsets;

import {
  Accordion,
  AccordionItem,
  AccordionItemTrigger,
  AccordionPanel,
} from '@plone/quanta';
import type { Content, FieldSchema } from '@plone/types';
import type { PrimitiveAtom } from 'jotai';

export type FieldsetsSchema = {
  fieldsets: Array<{ id: string; title: string; fields: string[] }>;
  properties: Record<string, FieldSchema>;
  required?: string[];
};

type SchemaFieldsetsProps = {
  /** The schema whose fieldsets and fields are rendered. */
  schema: FieldsetsSchema;
  /** The form created with `useAppForm`. */
  form: any;
  /** When given, the fields read and write their values through this atom. */
  formAtom?: PrimitiveAtom<any>;
  /** Extra props for a field, for example an `onChange` listener. */
  getFieldProps?: (fieldName: string) => {
    onChange?: (value: unknown) => void;
  };
};

/**
 * Renders a schema's fieldsets, and a widget for each of their fields.
 *
 * Every schema-driven form (content, control panels, block settings) renders
 * its fields through this component, so they all build the widget props the
 * same way.
 */
const SchemaFieldsets = ({
  schema,
  form,
  formAtom,
  getFieldProps,
}: SchemaFieldsetsProps) => (
  <>
    {schema.fieldsets.map((fieldset) => (
      <Accordion defaultExpandedKeys={['default']} key={fieldset.id}>
        <AccordionItem id={fieldset.id}>
          <AccordionItemTrigger>{fieldset.title}</AccordionItemTrigger>
          <AccordionPanel>
            {fieldset.fields.map((fieldName) => (
              <form.AppField
                name={fieldName}
                key={fieldName}
                // eslint-disable-next-line react/no-children-prop
                children={(field: any) => (
                  <field.SchemaField
                    className="mb-4"
                    name={fieldName}
                    schema={schema.properties[fieldName] ?? {}}
                    value={field.state.value}
                    required={schema.required?.includes(fieldName)}
                    errors={field.state.meta.errors}
                    formAtom={formAtom as PrimitiveAtom<Content> | undefined}
                    {...getFieldProps?.(fieldName)}
                  />
                )}
              />
            ))}
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
    ))}
  </>
);

export default SchemaFieldsets;

import { twMerge } from 'tailwind-merge';
import SchemaField from '../Form/Field';
import type { ItemSchema } from '../ObjectListWidget/objectList';

type ObjectFieldsProps = {
  /** The schema of the object. */
  schema: ItemSchema;
  /**
   * The path of the object in the form, such as `link` or `actions.2`. Each
   * field is rendered at `<path>.<field>`. Empty for the form's own values.
   */
  path: string;
  className?: string;
};

/**
 * Renders the fields of an object's schema, each at its path in the current
 * form. It must be rendered inside a `FormProvider`.
 *
 * The fields of the first fieldset come first. The other fieldsets follow,
 * each under its title.
 */
export function ObjectFields({ schema, path, className }: ObjectFieldsProps) {
  const fieldName = (field: string) => (path ? `${path}.${field}` : field);
  const renderFields = (fields: string[]) =>
    fields.map((field) => (
      <SchemaField
        key={field}
        name={fieldName(field)}
        schema={schema.properties[field] ?? {}}
        required={schema.required?.includes(field)}
      />
    ));

  return (
    <div className={twMerge('flex flex-col gap-4', className)}>
      {schema.fieldsets.map((fieldset, index) =>
        index === 0 ? (
          renderFields(fieldset.fields)
        ) : (
          <fieldset
            key={fieldset.id}
            className="m-0 flex flex-col gap-4 border-0 border-t border-quanta-smoke p-0 pt-4"
          >
            <legend className="float-left mb-4 w-full p-0 text-sm font-semibold text-quanta-iron">
              {fieldset.title}
            </legend>
            {renderFields(fieldset.fields)}
          </fieldset>
        ),
      )}
    </div>
  );
}

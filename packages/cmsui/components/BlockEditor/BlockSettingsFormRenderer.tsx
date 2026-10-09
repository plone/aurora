import SchemaFieldsets, { type FieldsetsSchema } from '../Form/SchemaFieldsets';
import type { FieldProps } from '../Form/Field';

type BlockSettingsFormRendererProps = {
  schema: FieldsetsSchema;
  getFieldProps?: (
    fieldName: string,
  ) => Partial<Pick<FieldProps, 'onChange' | 'setValue' | 'onBlur'>>;
};

/** Renders the block settings fields. Must be inside a `FormProvider`. */
const BlockSettingsFormRenderer = ({
  schema,
  getFieldProps,
}: BlockSettingsFormRendererProps) => (
  <form>
    <SchemaFieldsets schema={schema} getFieldProps={getFieldProps} />
  </form>
);

export default BlockSettingsFormRenderer;

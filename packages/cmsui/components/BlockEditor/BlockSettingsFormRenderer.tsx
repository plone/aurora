import SchemaFieldsets, { type FieldsetsSchema } from '../Form/SchemaFieldsets';

type BlockSettingsFormRendererProps = {
  schema: FieldsetsSchema;
  form: any;
  getFieldProps: (fieldName: string) => {
    onChange?: (value: unknown) => void;
  };
};

const BlockSettingsFormRenderer = ({
  schema,
  form,
  getFieldProps,
}: BlockSettingsFormRendererProps) => (
  <form>
    <SchemaFieldsets
      schema={schema}
      form={form}
      getFieldProps={getFieldProps}
    />
  </form>
);

export default BlockSettingsFormRenderer;

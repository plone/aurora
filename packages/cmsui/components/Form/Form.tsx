import { createFormHookContexts, createFormHook } from '@tanstack/react-form';
import SchemaField from './Field';

// export useFieldContext for use in your custom components
export const { fieldContext, formContext, useFieldContext, useFormContext } =
  createFormHookContexts();

export const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  // We'll learn more about these options later
  fieldComponents: {
    SchemaField,
    /** @deprecated Use `SchemaField`. */
    Quanta: SchemaField,
  },
  formComponents: {},
});

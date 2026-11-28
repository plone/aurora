import { useEffect } from 'react';
import {
  isDeepEqual,
  useFormStore,
  useOptionalFormContext,
  type FormApi,
} from '@plone/helpers';

/**
 * The form a widget renders its own form fields in, such as the fields of the
 * `object` widget. Render them in a `FormProvider` with it.
 *
 * In a form, it is that form: the widget's value is the form's value at
 * `name`, so its fields write to the form at `<name>.<field>`. There is one
 * source of truth, and the form validates and saves them with everything
 * else.
 *
 * Outside a form, for example in Storybook or a test, it is a form of the
 * widget's own, holding only its value. Changes in it are reported with
 * `onChange`, and a new `value` starts it over.
 */
export function useWidgetForm<V>({
  name,
  value,
  onChange,
}: {
  name: string;
  value: V;
  onChange: (value: V) => void;
}): FormApi<Record<string, unknown>> {
  const parent = useOptionalFormContext();
  const local = useFormStore<Record<string, unknown>>({
    key: name,
    initialValues: { [name]: value },
    onValuesChange: (values) => {
      if (!parent) onChange(values[name] as V);
    },
  });

  useEffect(() => {
    if (parent) return;
    if (isDeepEqual(local.getValues()[name], value)) return;
    local.reset({ [name]: value });
  }, [parent, local, name, value]);

  return parent ?? local;
}

// The React bindings of the form layer. The rest of `form/` does not depend
// on React.
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
} from 'react';
import type { ReactNode } from 'react';
import { useAtomValue } from 'jotai';
import { createFormStore } from './createFormStore';
import type {
  FieldMeta,
  FormApi,
  FormOptions,
  FormState,
} from './createFormStore';

const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

const FormContext = createContext<FormApi<any> | null>(null);

/**
 * Creates the store of a form and keeps it for as long as `key` is the same.
 *
 * Use the form's identity as `key`, for example the content's `@id` or the
 * control panel's id: a new key creates a fresh store, so moving to another
 * item never keeps the previous values. The callbacks are kept up to date on
 * every render.
 */
export function useFormStore<T>({
  key,
  ...options
}: FormOptions<T> & { key: string }): FormApi<T> {
  // The store only depends on the key: the initial values and validators are
  // read when it is created.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const form = useMemo(() => createFormStore<T>(options), [key]);

  const { onSubmit, onValuesChange } = options;
  useIsomorphicLayoutEffect(() => {
    form.setOptions({ onSubmit, onValuesChange });
  }, [form, onSubmit, onValuesChange]);

  return form;
}

/** Makes a form available to the components inside it. */
export function FormProvider<T>({
  form,
  children,
}: {
  form: FormApi<T>;
  children: ReactNode;
}) {
  return <FormContext.Provider value={form}>{children}</FormContext.Provider>;
}

/** The form that the component is rendered in. Throws outside a form. */
export function useFormContext<T = Record<string, unknown>>(): FormApi<T> {
  const form = useContext(FormContext);
  if (!form) {
    throw new Error('useFormContext must be used inside a <FormProvider>.');
  }
  return form;
}

/** The form that the component is rendered in, or `null` outside a form. */
export function useOptionalFormContext<
  T = Record<string, unknown>,
>(): FormApi<T> | null {
  return useContext(FormContext);
}

/**
 * The value at a path of the current form. The component re-renders only
 * when that value changes.
 */
export function useFieldValue<V = unknown>(path: string): V {
  const form = useFormContext();
  return useAtomValue(form.fieldAtom(path), { store: form.store }) as V;
}

/** A setter for the value at a path of the current form. */
export function useSetFieldValue<V = unknown>(path: string) {
  const form = useFormContext();
  return useCallback(
    (value: V) => form.setFieldValue(path, value as never),
    [form, path],
  );
}

/**
 * One field of the current form: its value, its state, and the handlers a
 * widget reports changes with.
 */
export function useSchemaField<V = unknown>(path: string) {
  const form = useFormContext();
  const value = useAtomValue(form.fieldAtom(path), { store: form.store }) as
    V | undefined;
  const meta: FieldMeta = useAtomValue(form.metaAtom(path), {
    store: form.store,
  });
  const onChange = useCallback(
    (next: V) => form.setFieldValue(path, next as never),
    [form, path],
  );
  const onBlur = useCallback(() => form.touch(path), [form, path]);

  return { name: path, value, onChange, onBlur, meta };
}

/** The state of the current form, for example to disable a save button. */
export function useFormState(): FormState {
  const form = useFormContext();
  return useAtomValue(form.stateAtom, { store: form.store });
}

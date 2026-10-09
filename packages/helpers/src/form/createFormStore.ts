import { atom, createStore } from 'jotai/vanilla';
import type { Atom, PrimitiveAtom } from 'jotai/vanilla';
import { isDeepEqual } from '../primitives';
import { getByPath, setByPath } from './path';
import type { Path, PathValue } from './path';

type Store = ReturnType<typeof createStore>;

/** Validates one field. Returns an error message, or `undefined` if valid. */
export type FieldValidator<T> = (value: any, values: T) => string | undefined;

/** Error messages by field path. */
export type FieldErrors = Record<string, string>;

export type SubmitResult = { ok: true } | { ok: false; errors: FieldErrors };

export type FormOptions<T> = {
  /** The values the form starts from, and compares with to tell if dirty. */
  initialValues: T;
  /**
   * Validators by field path. They are fixed for the life of the form.
   */
  validators?: Record<string, FieldValidator<T>>;
  /** Called with the new values after each change made through the form. */
  onValuesChange?: (values: T) => void;
  /**
   * Called with the values when the form is submitted and valid. It can
   * return errors by field path, for example the validation errors of the
   * server, to show them on the fields.
   */
  onSubmit?: (values: T) => void | FieldErrors | Promise<void | FieldErrors>;
};

export type FieldMeta = {
  /** The editor left the field at least once. */
  touched: boolean;
  /** The value differs from the initial value. */
  dirty: boolean;
  /** The errors to show: empty until the field is touched or the form submitted. */
  errors: string[];
  invalid: boolean;
};

export type FormState = {
  isSubmitting: boolean;
  /** The editor tried to submit the form at least once. */
  submitted: boolean;
  /** Some value differs from the initial values. */
  isDirty: boolean;
};

export interface FormApi<T> {
  /** The Jotai store that holds this form's state. */
  readonly store: Store;
  /** All the values. Read it through the store; change it through the API. */
  readonly valuesAtom: Atom<T>;
  /** The value at a path. Only notifies when that value changes. */
  fieldAtom(path: string): Atom<unknown>;
  /** The state of the field at a path. Only notifies when it changes. */
  metaAtom(path: string): Atom<FieldMeta>;
  readonly stateAtom: Atom<FormState>;
  getValues(): T;
  getFieldValue<P extends Path<T>>(path: P): PathValue<T, P>;
  setFieldValue<P extends Path<T>>(path: P, value: PathValue<T, P>): void;
  /** Replaces all the values, as a change made through the form. */
  setValues(values: T): void;
  /** Marks a field as touched, so its errors show. */
  touch(path: string): void;
  /**
   * Starts over from new initial values (or the current initial values):
   * clears touched fields, server errors and the submitted state. It does
   * not call `onValuesChange`.
   */
  reset(values?: T): void;
  /** The current errors of all validated fields, shown or not. */
  getErrors(): FieldErrors;
  submit(): Promise<SubmitResult>;
  /** Updates the callbacks (`onValuesChange`, `onSubmit`). */
  setOptions(
    options: Partial<Pick<FormOptions<T>, 'onValuesChange' | 'onSubmit'>>,
  ): void;
}

/** Returns the previous value when the next one is deeply equal. */
const stabilized = <V>(compute: (get: <A>(a: Atom<A>) => A) => V): Atom<V> => {
  let previous: V | undefined;
  let hasPrevious = false;
  return atom((get) => {
    const next = compute(get);
    if (hasPrevious && isDeepEqual(previous, next)) return previous as V;
    previous = next;
    hasPrevious = true;
    return next;
  });
};

/**
 * Creates the state of one form: its values, and the touched, dirty and error
 * state of its fields, in a Jotai store of its own.
 *
 * The values are the single source of truth: fields, and any code that has
 * the form, read and write them through the store. Each field subscribes to
 * its own path, so a change re-renders only the fields it affects.
 */
export function createFormStore<T>(initialOptions: FormOptions<T>): FormApi<T> {
  const options = { ...initialOptions };
  const validators = initialOptions.validators ?? {};
  const store = createStore();

  const valuesAtom = atom(initialOptions.initialValues);
  const initialValuesAtom = atom(initialOptions.initialValues);
  const submittedAtom = atom(false);
  const isSubmittingAtom = atom(false);

  const perPath = <A>(create: (path: string) => A) => {
    const cache = new Map<string, A>();
    return (path: string) => {
      let value = cache.get(path);
      if (!value) {
        value = create(path);
        cache.set(path, value);
      }
      return value;
    };
  };

  const fieldAtom = perPath((path) =>
    atom((get) => getByPath(get(valuesAtom), path)),
  );
  const touchedAtoms = new Map<string, PrimitiveAtom<boolean>>();
  const touchedAtom = perPath((path) => {
    const touched = atom(false);
    touchedAtoms.set(path, touched);
    return touched;
  });
  const serverErrorAtoms = new Map<string, PrimitiveAtom<string | undefined>>();
  const serverErrorAtom = perPath((path) => {
    const serverError = atom<string | undefined>(undefined);
    serverErrorAtoms.set(path, serverError);
    return serverError;
  });

  const metaAtom = perPath((path) =>
    stabilized<FieldMeta>((get) => {
      const value = get(fieldAtom(path));
      const validator = validators[path];
      // Only a validated field depends on the other values.
      const validationError = validator
        ? validator(value, get(valuesAtom))
        : undefined;
      const serverError = get(serverErrorAtom(path));
      const allErrors = [validationError, serverError].filter(
        (error): error is string => !!error,
      );
      const touched = get(touchedAtom(path));
      const visible = touched || get(submittedAtom);
      return {
        touched,
        dirty: !isDeepEqual(value, getByPath(get(initialValuesAtom), path)),
        errors: visible ? allErrors : [],
        invalid: visible && allErrors.length > 0,
      };
    }),
  );

  const stateAtom = stabilized<FormState>((get) => ({
    isSubmitting: get(isSubmittingAtom),
    submitted: get(submittedAtom),
    isDirty: !isDeepEqual(get(valuesAtom), get(initialValuesAtom)),
  }));

  const getValues = () => store.get(valuesAtom);

  const setValues = (values: T) => {
    store.set(valuesAtom, values);
    options.onValuesChange?.(values);
  };

  const getErrors = () => {
    const values = getValues();
    const errors: FieldErrors = {};
    for (const [path, validator] of Object.entries(validators)) {
      const error = validator(getByPath(values, path), values);
      if (error) errors[path] = error;
    }
    return errors;
  };

  return {
    store,
    valuesAtom,
    fieldAtom,
    metaAtom,
    stateAtom,
    getValues,
    getFieldValue: (path) => getByPath(getValues(), path) as any,
    setFieldValue: (path, value) => {
      // A server error is about the value that was sent: changing the field
      // clears it.
      if (serverErrorAtoms.has(path))
        store.set(serverErrorAtom(path), undefined);
      setValues(setByPath(getValues(), path, value));
    },
    setValues,
    touch: (path) => store.set(touchedAtom(path), true),
    reset: (values) => {
      const next = values ?? store.get(initialValuesAtom);
      store.set(initialValuesAtom, next);
      store.set(valuesAtom, next);
      store.set(submittedAtom, false);
      for (const touched of touchedAtoms.values()) store.set(touched, false);
      for (const error of serverErrorAtoms.values())
        store.set(error, undefined);
    },
    getErrors,
    submit: async () => {
      store.set(submittedAtom, true);
      const errors = getErrors();
      if (Object.keys(errors).length > 0) return { ok: false, errors };

      store.set(isSubmittingAtom, true);
      try {
        const serverErrors = await options.onSubmit?.(getValues());
        if (serverErrors && Object.keys(serverErrors).length > 0) {
          for (const [path, message] of Object.entries(serverErrors)) {
            store.set(serverErrorAtom(path), message);
          }
          return { ok: false, errors: serverErrors };
        }
        return { ok: true };
      } finally {
        store.set(isSubmittingAtom, false);
      }
    },
    setOptions: (next) => {
      if ('onValuesChange' in next)
        options.onValuesChange = next.onValuesChange;
      if ('onSubmit' in next) options.onSubmit = next.onSubmit;
    },
  };
}

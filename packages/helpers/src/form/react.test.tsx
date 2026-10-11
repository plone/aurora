import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  FormProvider,
  useFieldValue,
  useFormContext,
  useFormStore,
  useOptionalFormContext,
  useSchemaField,
} from './react';
import type { FormApi } from './createFormStore';

type Values = { title: string; description: string };

const renders: Record<string, number> = {};

const valueOf = (label: string) =>
  (screen.getByLabelText(label) as HTMLInputElement).value;

function TextField({ path }: { path: string }) {
  renders[path] = (renders[path] ?? 0) + 1;
  const field = useSchemaField<string>(path);
  return (
    <label>
      {path}
      <input
        aria-label={path}
        value={field.value ?? ''}
        onChange={(event) => field.onChange(event.target.value)}
        onBlur={field.onBlur}
      />
      {field.meta.errors.map((error) => (
        <span key={error}>{error}</span>
      ))}
    </label>
  );
}

let exposedForm: FormApi<Values> | null = null;
function ExposeForm() {
  exposedForm = useFormContext<Values>();
  return null;
}

function TestForm({
  id,
  values,
  onValuesChange,
}: {
  id: string;
  values: Values;
  onValuesChange?: (values: Values) => void;
}) {
  const form = useFormStore<Values>({
    key: id,
    initialValues: values,
    validators: { title: (value) => (value ? undefined : 'Required') },
    onValuesChange,
  });
  return (
    <FormProvider form={form}>
      <TextField path="title" />
      <TextField path="description" />
      <ExposeForm />
    </FormProvider>
  );
}

const values: Values = { title: 'Hello', description: 'World' };

describe('form React bindings', () => {
  it('re-renders only the field that changes', () => {
    render(<TestForm id="a" values={values} />);
    renders.title = 0;
    renders.description = 0;

    fireEvent.change(screen.getByLabelText('title'), {
      target: { value: 'Hello!' },
    });

    expect(valueOf('title')).toBe('Hello!');
    expect(renders.title).toBe(1);
    expect(renders.description).toBe(0);
  });

  it('shows changes made from outside the field', () => {
    render(<TestForm id="a" values={values} />);

    act(() => exposedForm!.setFieldValue('description', 'From Plate'));

    expect(valueOf('description')).toBe('From Plate');
  });

  it('shows a field error after blur', () => {
    render(<TestForm id="a" values={values} />);
    const title = screen.getByLabelText('title');
    fireEvent.change(title, { target: { value: '' } });
    expect(screen.queryByText('Required')).toBeNull();

    fireEvent.blur(title);

    expect(screen.getByText('Required')).toBeTruthy();
  });

  it('uses the latest onValuesChange', () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = render(
      <TestForm id="a" values={values} onValuesChange={first} />,
    );
    rerender(<TestForm id="a" values={values} onValuesChange={second} />);

    fireEvent.change(screen.getByLabelText('title'), {
      target: { value: 'Changed' },
    });

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith({
      title: 'Changed',
      description: 'World',
    });
  });

  it('creates a fresh store when the key changes', () => {
    const { rerender } = render(<TestForm id="a" values={values} />);
    fireEvent.change(screen.getByLabelText('title'), {
      target: { value: 'Edited' },
    });

    rerender(
      <TestForm id="b" values={{ title: 'Other', description: 'Item' }} />,
    );

    expect(valueOf('title')).toBe('Other');
  });

  it('keeps the store, and the edits, while the key is the same', () => {
    const { rerender } = render(<TestForm id="a" values={values} />);
    fireEvent.change(screen.getByLabelText('title'), {
      target: { value: 'Edited' },
    });

    rerender(<TestForm id="a" values={{ ...values }} />);

    expect(valueOf('title')).toBe('Edited');
  });

  it('reads a single value with useFieldValue', () => {
    function Title() {
      return <output>{useFieldValue<string>('title')}</output>;
    }
    function Form() {
      const form = useFormStore<Values>({ key: 'a', initialValues: values });
      return (
        <FormProvider form={form}>
          <Title />
        </FormProvider>
      );
    }
    render(<Form />);
    expect(screen.getByRole('status').textContent).toBe('Hello');
  });

  it('gives no form outside a FormProvider', () => {
    function Probe() {
      return (
        <output>{useOptionalFormContext() === null ? 'none' : 'form'}</output>
      );
    }
    render(<Probe />);
    expect(screen.getByRole('status').textContent).toBe('none');
  });
});

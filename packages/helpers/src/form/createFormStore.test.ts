import { describe, expect, it, vi } from 'vitest';
import { createFormStore } from './createFormStore';

type Values = {
  title: string;
  description: string;
  settings?: { caption: string };
};

const initialValues: Values = { title: 'Hello', description: '' };

describe('createFormStore', () => {
  it('reads and writes values by path', () => {
    const form = createFormStore<Values>({ initialValues });
    form.setFieldValue('settings.caption', 'A caption');

    expect(form.getFieldValue('settings.caption')).toBe('A caption');
    expect(form.getValues()).toEqual({
      title: 'Hello',
      description: '',
      settings: { caption: 'A caption' },
    });
  });

  it('calls onValuesChange with the new values', () => {
    const onValuesChange = vi.fn();
    const form = createFormStore<Values>({ initialValues, onValuesChange });
    form.setFieldValue('title', 'Changed');

    expect(onValuesChange).toHaveBeenCalledWith({
      title: 'Changed',
      description: '',
    });
  });

  it('notifies a field only when its own value changes', () => {
    const form = createFormStore<Values>({ initialValues });
    const onTitle = vi.fn();
    const onDescription = vi.fn();
    form.store.sub(form.fieldAtom('title'), onTitle);
    form.store.sub(form.fieldAtom('description'), onDescription);
    form.store.sub(form.metaAtom('description'), onDescription);

    form.setFieldValue('title', 'Changed');

    expect(onTitle).toHaveBeenCalledTimes(1);
    expect(onDescription).not.toHaveBeenCalled();
  });

  it('tracks dirty fields against the initial values', () => {
    const form = createFormStore<Values>({ initialValues });
    form.setFieldValue('title', 'Changed');
    expect(form.store.get(form.metaAtom('title')).dirty).toBe(true);
    expect(form.store.get(form.stateAtom).isDirty).toBe(true);

    form.setFieldValue('title', 'Hello');
    expect(form.store.get(form.metaAtom('title')).dirty).toBe(false);
    expect(form.store.get(form.stateAtom).isDirty).toBe(false);
  });

  it('shows errors only once the field is touched or the form submitted', async () => {
    const form = createFormStore<Values>({
      initialValues: { title: '', description: '' },
      validators: { title: (value) => (value ? undefined : 'Required') },
    });
    expect(form.store.get(form.metaAtom('title'))).toMatchObject({
      errors: [],
      invalid: false,
    });

    form.touch('title');
    expect(form.store.get(form.metaAtom('title'))).toMatchObject({
      touched: true,
      errors: ['Required'],
      invalid: true,
    });

    form.reset();
    expect(form.store.get(form.metaAtom('title')).invalid).toBe(false);
    await form.submit();
    expect(form.store.get(form.metaAtom('title')).errors).toEqual(['Required']);
  });

  it('passes all the values to validators', () => {
    const form = createFormStore<{ start: number; end: number }>({
      initialValues: { start: 2, end: 1 },
      validators: {
        end: (end, values) =>
          end < values.start ? 'End must be after start' : undefined,
      },
    });

    expect(form.getErrors()).toEqual({ end: ['End must be after start'] });
    form.setFieldValue('end', 3);
    expect(form.getErrors()).toEqual({});
  });

  it('does not submit an invalid form', async () => {
    const onSubmit = vi.fn();
    const form = createFormStore<Values>({
      initialValues: { title: '', description: '' },
      validators: { title: (value) => (value ? undefined : 'Required') },
      onSubmit,
    });

    expect(await form.submit()).toEqual({
      ok: false,
      errors: { title: ['Required'] },
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits the values and tracks isSubmitting', async () => {
    let resolveSubmit: () => void = () => {};
    const onSubmit = vi.fn(
      () => new Promise<void>((resolve) => (resolveSubmit = resolve)),
    );
    const form = createFormStore<Values>({ initialValues, onSubmit });

    const submitted = form.submit();
    await Promise.resolve();
    expect(form.store.get(form.stateAtom).isSubmitting).toBe(true);
    resolveSubmit();

    expect(await submitted).toEqual({ ok: true });
    expect(onSubmit).toHaveBeenCalledWith(initialValues);
    expect(form.store.get(form.stateAtom).isSubmitting).toBe(false);
  });

  it('shows server errors until the field changes', async () => {
    const form = createFormStore<Values>({
      initialValues,
      onSubmit: () => ({ title: 'Already taken' }),
    });

    expect(await form.submit()).toEqual({
      ok: false,
      errors: { title: ['Already taken'] },
    });
    expect(form.store.get(form.metaAtom('title')).errors).toEqual([
      'Already taken',
    ]);

    form.setFieldValue('title', 'Another');
    expect(form.store.get(form.metaAtom('title')).errors).toEqual([]);
  });

  it('resets to new initial values without calling onValuesChange', () => {
    const onValuesChange = vi.fn();
    const form = createFormStore<Values>({ initialValues, onValuesChange });
    form.setFieldValue('title', 'Changed');
    form.touch('title');
    onValuesChange.mockClear();

    form.reset({ title: 'Other item', description: '' });

    expect(form.getValues()).toEqual({ title: 'Other item', description: '' });
    expect(form.store.get(form.metaAtom('title'))).toMatchObject({
      touched: false,
      dirty: false,
    });
    expect(onValuesChange).not.toHaveBeenCalled();
  });
  it('keeps every message of a validator', () => {
    const form = createFormStore<Values>({
      initialValues: { title: 'x', description: '' },
      validators: { title: () => ['Too short', 'Not allowed'] },
    });
    form.touch('title');

    expect(form.store.get(form.metaAtom('title')).errors).toEqual([
      'Too short',
      'Not allowed',
    ]);
    expect(form.getErrors()).toEqual({ title: ['Too short', 'Not allowed'] });
  });

  it('shows errors set from outside, until the field changes', () => {
    const form = createFormStore<Values>({ initialValues });
    form.touch('description');
    form.setServerErrors({ description: 'Not allowed here' });

    expect(form.store.get(form.metaAtom('description')).errors).toEqual([
      'Not allowed here',
    ]);

    form.setFieldValue('description', 'Changed');
    expect(form.store.get(form.metaAtom('description')).errors).toEqual([]);
  });

  describe('nested errors', () => {
    type List = { links: Array<{ title: string; href: string }> };
    const links: List = {
      links: [
        { title: 'Home', href: '/' },
        { title: '', href: '' },
      ],
    };
    // Validates the list and, by relative path, the fields of its items.
    const validators = {
      links: (value: List['links']) => ({
        '': value.length > 3 ? 'Too many links' : [],
        ...Object.fromEntries(
          value.flatMap((item, index) =>
            item.title ? [] : [[`${index}.title`, 'Required']],
          ),
        ),
      }),
    };

    it('reports the errors of the fields inside a field', () => {
      const form = createFormStore<List>({ initialValues: links, validators });
      expect(form.getErrors()).toEqual({ 'links.1.title': ['Required'] });

      form.touch('links.1.title');
      expect(form.store.get(form.metaAtom('links.1.title'))).toMatchObject({
        invalid: true,
        errors: ['Required'],
      });
      expect(form.store.get(form.metaAtom('links.0.title')).invalid).toBe(
        false,
      );
    });

    it('keeps the errors of the field itself', () => {
      const form = createFormStore<List>({
        initialValues: { links: [...links.links, ...links.links] },
        validators,
      });
      form.touch('links');
      expect(form.store.get(form.metaAtom('links')).errors).toEqual([
        'Too many links',
      ]);
    });

    it('updates the errors as the items change', () => {
      const form = createFormStore<List>({ initialValues: links, validators });
      form.touch('links.1.title');
      form.setFieldValue('links.1.title', 'About');
      expect(form.store.get(form.metaAtom('links.1.title')).invalid).toBe(
        false,
      );
      expect(form.getErrors()).toEqual({});
    });

    it('fails the submit on the errors of nested fields', async () => {
      const onSubmit = vi.fn();
      const form = createFormStore<List>({
        initialValues: links,
        validators,
        onSubmit,
      });
      const result = await form.submit();
      expect(result).toEqual({
        ok: false,
        errors: { 'links.1.title': ['Required'] },
      });
      expect(onSubmit).not.toHaveBeenCalled();
      expect(form.store.get(form.metaAtom('links.1.title')).invalid).toBe(true);
    });
  });

  it('counts the submit attempts', async () => {
    const form = createFormStore<Values>({
      initialValues,
      validators: { description: (value) => (value ? null : 'Required') },
    });
    expect(form.store.get(form.stateAtom).submitCount).toBe(0);
    await form.submit();
    await form.submit();
    expect(form.store.get(form.stateAtom)).toMatchObject({
      submitted: true,
      submitCount: 2,
    });
    form.reset();
    expect(form.store.get(form.stateAtom)).toMatchObject({
      submitted: false,
      submitCount: 0,
    });
  });
});

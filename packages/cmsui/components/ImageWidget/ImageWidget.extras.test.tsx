import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FormProvider, createFormStore } from '@plone/helpers';
import ImageWidget from './ImageWidget';

vi.mock('react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router')>()),
  useFetcher: () => ({ load: vi.fn(), submit: vi.fn(), data: undefined }),
}));

const blockData = {
  url: '/old-image',
  image_field: 'image',
  image_scales: { image: [{ download: '/old-image/@@images/image' }] },
};

const enterUrl = (url: string) => {
  const input = screen.getByPlaceholderText('Enter an image URL');
  fireEvent.change(input, { target: { value: url } });
  fireEvent.keyDown(input, { key: 'Enter' });
};

describe('ImageWidget extras', () => {
  it('stores the declared details in their own fields', () => {
    const form = createFormStore({ initialValues: blockData });
    const onChange = vi.fn();
    render(
      <FormProvider form={form}>
        <ImageWidget
          value=""
          onChange={onChange}
          extraFields={['image_field', 'image_scales']}
          hideObjectBrowserPicker
        />
      </FormProvider>,
    );

    // An external URL has no scales: the old image's details are cleared.
    enterUrl('https://example.com/photo.jpg');

    expect(form.getValues()).toMatchObject({
      image_field: undefined,
      image_scales: undefined,
    });
    expect(onChange).toHaveBeenCalledWith(
      'https://example.com/photo.jpg',
      undefined,
    );
  });

  it('stores nothing else without extraFields', () => {
    const form = createFormStore({ initialValues: blockData });
    render(
      <FormProvider form={form}>
        <ImageWidget value="" onChange={vi.fn()} hideObjectBrowserPicker />
      </FormProvider>,
    );

    enterUrl('https://example.com/photo.jpg');

    expect(form.getValues()).toEqual(blockData);
  });
});

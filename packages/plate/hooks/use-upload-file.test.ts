import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useUploadFile } from './use-upload-file';

vi.mock('sonner', () => ({
  toast: { error: vi.fn() },
}));

function mockFetch(body: Record<string, unknown>) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: vi.fn().mockResolvedValue(body),
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('useUploadFile', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    window.history.replaceState(null, '', '/');
  });

  it('uploads an image as multipart/form-data', async () => {
    window.history.replaceState(null, '', '/folder/page/@@edit');
    const fetchMock = mockFetch({
      '@id': '/folder/page/photo.png',
      UID: 'abc',
      title: 'photo.png',
    });

    const { result } = renderHook(() => useUploadFile());
    const file = new File(['fake-image-bytes'], 'photo.png', {
      type: 'image/png',
    });

    let uploaded;
    await act(async () => {
      uploaded = await result.current.uploadFile(file);
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/@createContent/folder/page');
    expect(init.headers).toBeUndefined();
    expect(init.body).toBeInstanceOf(FormData);

    const body = init.body as FormData;
    expect(JSON.parse(body.get('data') as string)).toEqual({
      '@type': 'Image',
      title: 'photo.png',
    });
    expect((body.get('image') as File).name).toBe('photo.png');

    expect(uploaded).toMatchObject({
      key: 'abc',
      url: '/folder/page/photo.png/@@images/image',
    });
  });

  it('uploads other files in the file field', async () => {
    const fetchMock = mockFetch({ '@id': '/doc.pdf' });

    const { result } = renderHook(() => useUploadFile());
    const file = new File(['%PDF'], 'doc.pdf', { type: 'application/pdf' });

    await act(async () => {
      await result.current.uploadFile(file);
    });

    const body = fetchMock.mock.calls[0][1].body as FormData;
    expect(JSON.parse(body.get('data') as string)).toEqual({
      '@type': 'File',
      title: 'doc.pdf',
    });
    expect((body.get('file') as File).name).toBe('doc.pdf');
    expect(body.get('image')).toBeNull();
  });
});

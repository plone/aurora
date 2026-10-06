// @vitest-environment node
// The action runs on the server: jsdom's File is not recognized by Node's
// Request, which would drop the filename of multipart parts.
import { afterEach, describe, expect, it, vi } from 'vitest';
import config from '@plone/registry';
import { action } from './createContent';
import { RouterContextProvider } from 'react-router';
import { ploneClientContext } from '@plone/aurora/app/middleware.server';

vi.mock('@plone/react-router', () => ({
  requireAuthCookie: vi.fn().mockResolvedValue('fake-token'),
}));

describe('createContent API route action', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    config.settings = {};
  });

  it('calls createContent with wildcard path and returns response data', async () => {
    const createContentMock = vi.fn().mockResolvedValue({
      data: {
        '@id': 'http://example.com/++api++/folder/new-image',
        title: 'new-image',
      },
    });

    config.settings.apiPath = 'http://example.com';
    const context = new RouterContextProvider();
    context.set(ploneClientContext, {
      createContent: createContentMock,
    } as any);

    const request = new Request('http://example.com/@createContent/folder', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          '@type': 'Image',
          title: 'new-image',
          image: {
            'content-type': 'image/png',
            data: 'ZmFrZS1pbWFnZS1ieXRlcw==',
            encoding: 'base64',
            filename: 'new-image.png',
          },
        },
      }),
    });

    const response = await action({
      request,
      params: { '*': 'folder' },
      context,
      pattern: '/@createContent/folder',
      url: new URL(request.url),
    });

    expect(createContentMock).toHaveBeenCalledWith({
      path: '/folder',
      data: {
        '@type': 'Image',
        title: 'new-image',
        image: {
          'content-type': 'image/png',
          data: 'ZmFrZS1pbWFnZS1ieXRlcw==',
          encoding: 'base64',
          filename: 'new-image.png',
        },
      },
    });

    expect((response as any).init?.status ?? 200).toBe(200);
    expect((response as any).data).toEqual({
      '@id': '/++api++/folder/new-image',
      title: 'new-image',
    });
  });

  it('passes multipart binary parts to createContent as File values', async () => {
    const createContentMock = vi.fn().mockResolvedValue({
      data: {
        '@id': 'http://example.com/++api++/folder/new-image',
        title: 'new-image.png',
      },
    });

    config.settings.apiPath = 'http://example.com';
    const context = new RouterContextProvider();
    context.set(ploneClientContext, {
      createContent: createContentMock,
    } as any);

    const formData = new FormData();
    formData.append('path', '/folder');
    formData.append(
      'data',
      JSON.stringify({ '@type': 'Image', title: 'new-image.png' }),
    );
    formData.append(
      'image',
      new File(['fake-image-bytes'], 'new-image.png', { type: 'image/png' }),
    );

    const request = new Request('http://example.com/@createContent/other', {
      method: 'POST',
      body: formData,
    });

    const response = await action({
      request,
      params: { '*': 'other' },
      context,
      pattern: '/@createContent/other',
      url: new URL(request.url),
    });

    expect(createContentMock).toHaveBeenCalledTimes(1);
    const { path, data } = createContentMock.mock.calls[0][0];
    expect(path).toBe('/folder');
    expect(data['@type']).toBe('Image');
    expect(data.title).toBe('new-image.png');
    expect(data.image).toBeInstanceOf(File);
    expect(data.image.name).toBe('new-image.png');
    expect(data.image.type).toBe('image/png');

    expect((response as any).data).toEqual({
      '@id': '/++api++/folder/new-image',
      title: 'new-image.png',
    });
  });

  it('rejects a multipart request without a valid data field', async () => {
    const createContentMock = vi.fn();
    const context = new RouterContextProvider();
    context.set(ploneClientContext, {
      createContent: createContentMock,
    } as any);

    const formData = new FormData();
    formData.append('data', 'not json');
    formData.append('image', new File(['x'], 'x.png', { type: 'image/png' }));

    const request = new Request('http://example.com/@createContent/folder', {
      method: 'POST',
      body: formData,
    });

    const response = await action({
      request,
      params: { '*': 'folder' },
      context,
      pattern: '/@createContent/folder',
      url: new URL(request.url),
    });

    expect(createContentMock).not.toHaveBeenCalled();
    expect((response as any).init?.status).toBe(400);
  });
});

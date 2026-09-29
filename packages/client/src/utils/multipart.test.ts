import { describe, expect, it } from 'vitest';
import { isBlob, toRequestBody } from './multipart';

function readBlob(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(blob);
  });
}

describe('isBlob', () => {
  it('accepts Blob and File', () => {
    expect(isBlob(new Blob(['x']))).toBe(true);
    expect(isBlob(new File(['x'], 'x.txt'))).toBe(true);
  });

  it('rejects other values', () => {
    expect(isBlob(null)).toBe(false);
    expect(isBlob('x')).toBe(false);
    expect(isBlob({ data: 'eA==', encoding: 'base64' })).toBe(false);
  });
});

describe('toRequestBody', () => {
  it('returns the data unchanged when there are no Blob values', () => {
    const data = {
      '@type': 'Image',
      title: 'My Image',
      image: {
        'content-type': 'image/png',
        data: 'iVBORw0KGgo=',
        encoding: 'base64',
        filename: 'image.png',
      },
    };

    expect(toRequestBody(data)).toBe(data);
  });

  it('builds a multipart body with a JSON data part and binary parts', async () => {
    const file = new File(['Spam and Eggs'], 'test.txt', {
      type: 'text/plain',
    });

    const body = toRequestBody({ '@type': 'File', title: 'My File', file });

    expect(body).toBeInstanceOf(FormData);
    const form = body as FormData;

    const dataPart = form.get('data') as File;
    expect(dataPart.name).toBe('data.json');
    expect(dataPart.type).toBe('application/json');
    expect(JSON.parse(await readBlob(dataPart))).toEqual({
      '@type': 'File',
      title: 'My File',
      file: { part: 'attachment_0' },
    });

    const filePart = form.get('attachment_0') as File;
    expect(filePart.name).toBe('test.txt');
    expect(filePart.type).toBe('text/plain');
    expect(await readBlob(filePart)).toBe('Spam and Eggs');
  });

  it('gives a fallback filename to unnamed Blob values', () => {
    const form = toRequestBody({
      '@type': 'File',
      title: 'My File',
      file: new Blob(['x'], { type: 'text/plain' }),
    }) as FormData;

    expect((form.get('attachment_0') as File).name).toBe('upload');
  });

  it('numbers the parts of several binary fields', async () => {
    const form = toRequestBody({
      '@type': 'File',
      title: 'My File',
      file: new File(['a'], 'a.txt'),
      preview_image: new File(['b'], 'b.png', { type: 'image/png' }),
    }) as FormData;

    const json = JSON.parse(await readBlob(form.get('data') as File));
    expect(json.file).toEqual({ part: 'attachment_0' });
    expect(json.preview_image).toEqual({ part: 'attachment_1' });
    expect((form.get('attachment_1') as File).name).toBe('b.png');
  });

  it('leaves nested Blob values and non-file objects alone', () => {
    const data = {
      '@type': 'Document',
      title: 'My Page',
      blocks: { a: { '@type': 'image', data: 'x', file: new Blob(['x']) } },
    };

    expect(toRequestBody(data)).toBe(data);
  });

  it('refuses to mix inline file payloads with Blob values', () => {
    expect(() =>
      toRequestBody({
        '@type': 'File',
        title: 'My File',
        file: new File(['a'], 'a.txt'),
        preview_image: {
          'content-type': 'image/png',
          data: 'iVBORw0KGgo=',
          encoding: 'base64',
          filename: 'image.png',
        },
      }),
    ).toThrow(/preview_image/);
  });
});

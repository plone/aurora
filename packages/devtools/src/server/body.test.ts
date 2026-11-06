import zlib from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { decodeBody, MAX_BODY, toPayload } from './body';
import { REDACTED } from './redact';

describe('decodeBody', () => {
  const text = Buffer.from('{"a":1}');
  it.each([
    ['gzip', zlib.gzipSync(text)],
    ['br', zlib.brotliCompressSync(text)],
    ['deflate', zlib.deflateSync(text)],
    [undefined, text],
  ])('decodes %s', (encoding, buf) => {
    expect(decodeBody(buf, encoding).toString()).toBe('{"a":1}');
  });

  it('returns the raw bytes when the encoding header is wrong', () => {
    expect(decodeBody(text, 'gzip')).toBe(text);
  });
});

describe('toPayload', () => {
  it('parses and redacts JSON', () => {
    expect(
      toPayload(
        Buffer.from('{"login":"a","password":"b"}'),
        'application/json',
      ),
    ).toEqual({ body: { login: 'a', password: REDACTED }, truncated: false });
  });

  it('parses and redacts forms', () => {
    expect(
      toPayload(
        Buffer.from('username=a&password=b'),
        'application/x-www-form-urlencoded',
      ),
    ).toEqual({
      body: { username: 'a', password: REDACTED },
      truncated: false,
    });
  });

  it('keeps invalid JSON and other types as text', () => {
    expect(toPayload(Buffer.from('{oops'), 'application/json').body).toBe(
      '{oops',
    );
    expect(toPayload(Buffer.from('<p>hi</p>'), 'text/html').body).toBe(
      '<p>hi</p>',
    );
  });

  it('cuts large bodies and does not parse them', () => {
    const big = Buffer.from(`"${'x'.repeat(MAX_BODY)}"`);
    const result = toPayload(big, 'application/json');
    expect(result.truncated).toBe(true);
    expect(typeof result.body).toBe('string');
    expect((result.body as string).length).toBe(MAX_BODY);
  });
});

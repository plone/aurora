import zlib from 'node:zlib';
import { redact } from './redact';

/** Bodies larger than this are cut, and not parsed. */
export const MAX_BODY = 512 * 1024;

export function decodeBody(buf: Buffer, encoding?: string): Buffer {
  try {
    if (encoding === 'gzip') return zlib.gunzipSync(buf);
    if (encoding === 'br') return zlib.brotliDecompressSync(buf);
    if (encoding === 'deflate') return zlib.inflateSync(buf);
  } catch {
    // Not what the header says: show the raw bytes.
  }
  return buf;
}

/**
 * Turns a body into something the panel can show: parsed JSON (or a parsed
 * form) when possible, text otherwise, with secrets redacted.
 */
export function toPayload(
  buf: Buffer,
  contentType = '',
): { body: unknown; truncated: boolean } {
  const truncated = buf.length > MAX_BODY;
  const text = buf.subarray(0, MAX_BODY).toString('utf-8');
  if (!truncated && contentType.includes('json')) {
    try {
      return { body: redact(JSON.parse(text)), truncated };
    } catch {
      // Not valid JSON after all.
    }
  }
  if (!truncated && contentType.includes('application/x-www-form-urlencoded')) {
    return {
      body: redact(Object.fromEntries(new URLSearchParams(text))),
      truncated,
    };
  }
  return { body: text, truncated };
}

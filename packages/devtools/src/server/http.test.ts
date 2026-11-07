import http from 'node:http';
import zlib from 'node:zlib';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { BackendCall } from '../events';
import { recorded } from './buffer';
import { als } from './context';
import { installHttpCapture } from './http';
import { REDACTED } from './redact';

let server: http.Server;
let base: string;

beforeAll(async () => {
  server = http.createServer((req, res) => {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      const payload = JSON.stringify({
        echo: JSON.parse(body || '{}'),
        token: 'jwt',
      });
      res.writeHead(201, {
        'content-type': 'application/json',
        'content-encoding': 'gzip',
      });
      res.end(zlib.gzipSync(payload));
    });
  });
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  installHttpCapture();
});

afterAll(() => new Promise<void>((r) => server.close(() => r())));

function post(path: string, body: unknown): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = http.request(`${base}${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
    });
    req.on('response', (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () =>
        resolve(zlib.gunzipSync(Buffer.concat(chunks)).toString()),
      );
    });
    req.on('error', reject);
    req.end(JSON.stringify(body));
  });
}

const calls = () =>
  recorded()
    .filter((e) => e.type === 'backend-call')
    .map((e) => e.payload as BackendCall);

describe('installHttpCapture', () => {
  it('captures calls made while handling a request, with bodies', async () => {
    const text = await als.run({ requestId: 'r1', routeId: 'root' }, () =>
      post('/@login', { login: 'a', password: 'b' }),
    );
    // The caller still gets the whole response.
    expect(JSON.parse(text)).toEqual({
      echo: { login: 'a', password: 'b' },
      token: 'jwt',
    });
    // Wait for the capture's own `end` listener.
    await new Promise((r) => setTimeout(r, 20));
    const done = calls().find((c) => c.requestId === 'r1' && c.end);
    expect(done).toMatchObject({
      routeId: 'root',
      method: 'POST',
      url: `${base}/@login`,
      statusCode: 201,
      contentType: 'application/json',
      requestBody: { login: 'a', password: REDACTED },
      responseBody: {
        echo: { login: 'a', password: REDACTED },
        token: REDACTED,
      },
    });
    // A start event came first, with the same id.
    expect(calls().filter((c) => c.id === done?.id)).toHaveLength(2);
  });

  it('ignores calls made outside a request', async () => {
    const before = calls().length;
    await post('/outside', {});
    await new Promise((r) => setTimeout(r, 20));
    expect(calls().length).toBe(before);
  });

  it('subscribes once, however often it is installed', async () => {
    installHttpCapture();
    installHttpCapture();
    await als.run({ requestId: 'r2' }, () => post('/again', {}));
    await new Promise((r) => setTimeout(r, 20));
    expect(calls().filter((c) => c.requestId === 'r2')).toHaveLength(2);
  });
});

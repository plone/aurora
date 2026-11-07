/**
 * Captures the calls the server makes while handling a request, such as the
 * calls `@plone/client` makes to the Plone REST API, with no change to the
 * client: Node's `http`/`https` modules publish to `diagnostics_channel`.
 *
 * - `http.client.request.created` fires in the `ClientRequest` constructor,
 *   before the body is written, so `write`/`end` are wrapped there.
 *   (`http.client.request.start` fires only after `end()`.)
 * - `http.client.response.finish` publishes in the same tick the caller
 *   attaches its own listeners, so a `data` listener sees every chunk without
 *   taking any from the caller.
 */
import diagnostics from 'node:diagnostics_channel';
import { randomUUID } from 'node:crypto';
import { decodeBody, toPayload, MAX_BODY } from './body';
import { als, emit, now, type RequestStore } from './context';

type ClientRequest = {
  method: string;
  protocol: string;
  host: string;
  path: string;
  getHeader(name: string): unknown;
  write: (...args: unknown[]) => boolean;
  end: (...args: unknown[]) => unknown;
};
type IncomingMessage = {
  statusCode?: number;
  headers: Record<string, string | string[] | undefined>;
  on(event: 'data', fn: (chunk: Buffer) => void): void;
  on(event: 'end', fn: () => void): void;
};
type Pending = {
  id: string;
  start: number;
  store: RequestStore;
  chunks: Buffer[];
};
type Handlers = Record<'created' | 'start' | 'finish', (m: unknown) => void>;

const CHANNELS = {
  created: 'http.client.request.created',
  start: 'http.client.request.start',
  finish: 'http.client.response.finish',
} as const;

const pending = new WeakMap<object, Pending>();

const toBuffer = (chunk: unknown) =>
  Buffer.isBuffer(chunk)
    ? chunk
    : typeof chunk === 'string'
      ? Buffer.from(chunk)
      : chunk instanceof Uint8Array
        ? Buffer.from(chunk)
        : null;

const urlOf = (r: ClientRequest) =>
  `${r.protocol}//${String(r.getHeader('host') ?? r.host)}${r.path}`;

const handlers: Handlers = {
  created(message) {
    const { request } = message as { request: ClientRequest };
    const store = als.getStore();
    if (!store) return; // Only calls made while handling a request.
    const entry: Pending = {
      id: randomUUID(),
      start: now(),
      store: { ...store },
      chunks: [],
    };
    pending.set(request, entry);
    const write = request.write;
    const end = request.end;
    request.write = function (
      this: unknown,
      chunk: unknown,
      ...rest: unknown[]
    ) {
      const b = toBuffer(chunk);
      if (b) entry.chunks.push(b);
      return write.call(this, chunk, ...rest);
    };
    request.end = function (this: unknown, chunk: unknown, ...rest: unknown[]) {
      const b = typeof chunk === 'function' ? null : toBuffer(chunk);
      if (b) entry.chunks.push(b);
      return end.call(this, chunk, ...rest);
    };
  },
  start(message) {
    const { request } = message as { request: ClientRequest };
    const entry = pending.get(request);
    if (!entry) return;
    emit('backend-call', {
      id: entry.id,
      requestId: entry.store.requestId,
      routeId: entry.store.routeId,
      method: request.method,
      url: urlOf(request),
      start: entry.start,
    });
  },
  finish(message) {
    const { request, response } = message as {
      request: ClientRequest;
      response: IncomingMessage;
    };
    const entry = pending.get(request);
    if (!entry) return;
    const chunks: Buffer[] = [];
    let size = 0;
    response.on('data', (chunk) => {
      size += chunk.length;
      // Compressed bodies may grow when decoded; keep a margin, not all.
      if (size <= MAX_BODY * 4) chunks.push(chunk);
    });
    response.on('end', () => {
      const header = (name: string) => String(response.headers[name] ?? '');
      const res = toPayload(
        decodeBody(Buffer.concat(chunks), header('content-encoding')),
        header('content-type'),
      );
      const req = entry.chunks.length
        ? toPayload(
            Buffer.concat(entry.chunks),
            String(request.getHeader('content-type') ?? ''),
          )
        : undefined;
      emit('backend-call', {
        id: entry.id,
        requestId: entry.store.requestId,
        routeId: entry.store.routeId,
        method: request.method,
        url: urlOf(request),
        statusCode: response.statusCode,
        start: entry.start,
        end: now(),
        size,
        contentType: header('content-type'),
        requestBody: req?.body,
        responseBody: res.body,
        truncated: res.truncated || req?.truncated,
      });
    });
  },
};

const g = globalThis as unknown as { __ploneDevtoolsHttp?: Handlers };

/**
 * Subscribes to the HTTP channels, replacing the subscribers of a previous
 * evaluation of this module.
 */
export function installHttpCapture() {
  if (g.__ploneDevtoolsHttp === handlers) return;
  const previous = g.__ploneDevtoolsHttp;
  for (const key of Object.keys(CHANNELS) as (keyof Handlers)[]) {
    if (previous) diagnostics.unsubscribe(CHANNELS[key], previous[key]);
    diagnostics.subscribe(CHANNELS[key], handlers[key]);
  }
  g.__ploneDevtoolsHttp = handlers;
}

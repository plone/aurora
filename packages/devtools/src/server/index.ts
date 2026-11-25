/**
 * Server instrumentation for React Router. Export it from `entry.server.tsx`,
 * in development only:
 *
 * ```ts
 * export const instrumentations =
 *   import.meta.env.DEV && import.meta.env.PLONE_DEVTOOLS
 *     ? [(await import('@plone/devtools/server')).serverInstrumentation]
 *     : [];
 * ```
 */
import { randomUUID } from 'node:crypto';
import type { ServerInstrumentation } from 'react-router';
import { als, emit, now } from './context';
import { installHttpCapture } from './http';

type HandlerKind = 'loader' | 'action' | 'middleware';
type HandlerResult = { status: 'success' | 'error'; error?: Error };

export const serverInstrumentation: ServerInstrumentation = {
  handler(handler) {
    installHttpCapture();
    handler.instrument({
      async request(handle, { request }) {
        const requestId = randomUUID();
        const start = now();
        await als.run({ requestId }, async () => {
          const result = await handle();
          emit('timing', {
            id: requestId,
            requestId,
            kind: 'request',
            side: 'server',
            method: request.method,
            url: request.url,
            start,
            end: now(),
            status: result.status,
            statusCode: result.statusCode,
            error: result.error?.message,
          });
        });
      },
    });
  },
  route(route) {
    const instrument =
      (kind: HandlerKind) =>
      async (
        handle: () => Promise<HandlerResult>,
        info: { request: { method: string; url: string } },
      ) => {
        const parent = als.getStore();
        const start = now();
        // Calls made inside this handler are attributed to its route.
        await als.run(
          { requestId: parent?.requestId ?? 'unknown', routeId: route.id },
          async () => {
            const result = await handle();
            emit('timing', {
              id: randomUUID(),
              requestId: parent?.requestId,
              kind,
              side: 'server',
              routeId: route.id,
              method: info.request.method,
              url: info.request.url,
              start,
              end: now(),
              status: result.status,
              error: result.error?.message,
            });
          },
        );
      };
    route.instrument({
      loader: instrument('loader'),
      action: instrument('action'),
      middleware: instrument('middleware'),
    });
  },
};

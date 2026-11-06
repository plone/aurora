import type { ClientInstrumentation } from 'react-router';
import { client } from './client';

const now = () => performance.timeOrigin + performance.now();
const uid = () =>
  globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);

/** Reports browser-side navigations and fetchers to the panel. */
export const clientInstrumentation: ClientInstrumentation = {
  router(router) {
    router.instrument({
      async navigate(handle, info) {
        const start = now();
        const result = await handle();
        client.emit('timing', {
          id: uid(),
          kind: 'navigate',
          side: 'client',
          url: String(info.to),
          method: (info.formMethod ?? 'GET').toUpperCase(),
          start,
          end: now(),
          status: result.status,
          error: result.error?.message,
        });
      },
      async fetch(handle, info) {
        const start = now();
        const result = await handle();
        client.emit('timing', {
          id: uid(),
          kind: 'fetch',
          side: 'client',
          url: info.href,
          method: (info.formMethod ?? 'GET').toUpperCase(),
          start,
          end: now(),
          status: result.status,
          error: result.error?.message,
        });
      },
    });
  },
};

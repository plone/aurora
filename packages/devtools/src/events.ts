/**
 * The event protocol between the server (Vite dev server and SSR code) and
 * the devtools panel in the browser. Events travel over the TanStack Devtools
 * event bus.
 */
// The `/production` entry is the real client in every environment. The root
// entry is a no-op unless `NODE_ENV === 'development'` when it is evaluated,
// which is not yet true when Vite loads its config. We gate the devtools
// ourselves (see `PLONE_DEVTOOLS`), so the real client is always wanted.
import { EventClient } from '@tanstack/devtools-event-client/production';

export const PLUGIN_ID = 'plone';

/** A request, navigation or route handler (middleware, loader, action). */
export type Timing = {
  id: string;
  /** Server request this timing belongs to. */
  requestId?: string;
  kind: 'request' | 'loader' | 'action' | 'middleware' | 'navigate' | 'fetch';
  side: 'server' | 'client';
  routeId?: string;
  method?: string;
  url?: string;
  /** Epoch milliseconds, with sub-millisecond precision. */
  start: number;
  end: number;
  status: 'success' | 'error';
  statusCode?: number;
  error?: string;
};

/** A call from the server to the backend (Plone REST API). */
export type BackendCall = {
  id: string;
  requestId?: string;
  /** Route whose middleware, loader or action made the call. */
  routeId?: string;
  method: string;
  url: string;
  statusCode?: number;
  start: number;
  /** Missing until the response has been read. */
  end?: number;
  error?: string;
  /** Response size in bytes, as received (possibly compressed). */
  size?: number;
  contentType?: string;
  /** Redacted request body, parsed when it is JSON or a form. */
  requestBody?: unknown;
  /** Response body, parsed when it is JSON. */
  responseBody?: unknown;
  truncated?: boolean;
};

export type RouteInfo = {
  id: string;
  parentId?: string;
  path?: string;
  index?: boolean;
  /** File on disk, relative to the app root. */
  file?: string;
  /** Path as the add-on registered it, e.g. `@plone/cmsui/routes/edit.tsx`. */
  source?: string;
  /** Add-on that contributed the route, or `app`. */
  addon?: string;
  hasLoader?: boolean;
  hasAction?: boolean;
  hasMiddleware?: boolean;
  /**
   * The names of the route's middleware functions, in the order they run.
   * An empty string stands for an anonymous function.
   */
  middleware?: string[];
};

export type BufferedEvent =
  | { type: 'timing'; payload: Timing }
  | { type: 'backend-call'; payload: BackendCall };

export type PloneDevtoolsEventMap = {
  timing: Timing;
  'backend-call': BackendCall;
  routes: { routes: RouteInfo[] };
  /** The panel says hello; the server answers with `replay` and `routes`. */
  'panel-connected': Record<string, never>;
  /** Server events sent before the panel connected. */
  replay: { events: BufferedEvent[] };
};

export function createEventClient() {
  return new EventClient<PloneDevtoolsEventMap>({ pluginId: PLUGIN_ID });
}

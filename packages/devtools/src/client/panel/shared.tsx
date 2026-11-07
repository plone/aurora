/**
 * Data hooks, formatting helpers and small components shared by the tabs.
 */
import { useEffect, useState, type ReactNode } from 'react';
import type { BackendCall, RouteInfo, Timing } from '../../events';
import { client } from '../client';

/* ------------------------------------------------------------------ data */

export type RouterState = {
  location: { pathname: string; search: string };
  matches: {
    route: { id: string };
    pathname: string;
    params: Record<string, string>;
  }[];
  loaderData: Record<string, unknown>;
  actionData: Record<string, unknown> | null;
  navigation: { state: string };
};
type DataRouter = {
  state: RouterState;
  subscribe: (fn: (s: RouterState) => void) => () => void;
  revalidate: () => void;
};
export const getRouter = () =>
  (window as unknown as { __reactRouterDataRouter?: DataRouter })
    .__reactRouterDataRouter;

export function useRouterState() {
  const [state, setState] = useState<RouterState | undefined>(
    () => getRouter()?.state,
  );
  useEffect(() => {
    // The devtools root may mount before hydration creates the router.
    let off: (() => void) | undefined;
    const attach = () => {
      const router = getRouter();
      if (!router) return false;
      setState(router.state);
      off = router.subscribe(setState);
      return true;
    };
    if (attach()) return () => off?.();
    const t = setInterval(() => attach() && clearInterval(t), 200);
    return () => {
      clearInterval(t);
      off?.();
    };
  }, []);
  return state;
}

export function useDevtoolsEvents() {
  const [routes, setRoutes] = useState<RouteInfo[]>([]);
  const [timings, setTimings] = useState<Record<string, Timing>>({});
  const [calls, setCalls] = useState<Record<string, BackendCall>>({});
  useEffect(() => {
    const addTiming = (t: Timing) => setTimings((m) => ({ ...m, [t.id]: t }));
    const addCall = (c: BackendCall) =>
      setCalls((m) => ({ ...m, [c.id]: { ...m[c.id], ...c } }));
    const offs = [
      client.on('timing', (e) => addTiming(e.payload)),
      client.on('backend-call', (e) => addCall(e.payload)),
      client.on('routes', (e) => setRoutes(e.payload.routes)),
      client.on('replay', (e) => {
        for (const ev of e.payload.events) {
          if (ev.type === 'timing') addTiming(ev.payload);
          else addCall(ev.payload);
        }
      }),
    ];
    client.emit('panel-connected', {});
    return () => offs.forEach((off) => off());
  }, []);
  const clear = () => {
    setTimings({});
    setCalls({});
  };
  return {
    routes,
    timings: Object.values(timings),
    calls: Object.values(calls),
    clear,
  };
}

/* --------------------------------------------------------------- helpers */

export const fmtMs = (a: number, b?: number) => {
  if (b === undefined) return '…';
  const d = b - a;
  if (d < 1) return '<1 ms';
  return d < 1000 ? `${Math.round(d)} ms` : `${(d / 1000).toFixed(2)} s`;
};
export const fmtBytes = (n?: number) =>
  n === undefined
    ? ''
    : n < 1024
      ? `${n} B`
      : n < 1024 * 1024
        ? `${(n / 1024).toFixed(1)} kB`
        : `${(n / 1024 / 1024).toFixed(1)} MB`;
export const pathOf = (url?: string) => {
  if (!url) return '';
  try {
    const u = new URL(url);
    return decodeURIComponent(u.pathname + u.search);
  } catch {
    return url;
  }
};
export const statusClass = (s?: number) =>
  !s ? '' : s >= 400 ? 'err' : s >= 300 ? 'redirect' : 'ok';

/**
 * A readable name for a route id while the route list has not arrived yet:
 * add-on route ids are absolute file paths.
 */
const shortId = (id: string) =>
  id.startsWith('/') ? `…/${id.split('/').slice(-3).join('/')}` : id;

/** The file a route comes from, as its add-on registered it. */
export const routeFile = (r: RouteInfo | undefined, id: string) =>
  r?.source ?? shortId(id);

/** The route's file without its add-on prefix and extension. */
export function routeLabel(routes: Map<string, RouteInfo>, id?: string) {
  if (!id) return '';
  const r = routes.get(id);
  return routeFile(r, id).replace(/\.[jt]sx?$/, '');
}

export type RouteKind = 'root' | 'layout' | 'index' | 'route';
export const kindOf = (r: RouteInfo | undefined, id: string): RouteKind =>
  id === 'root'
    ? 'root'
    : r?.index
      ? 'index'
      : r && r.path === undefined
        ? 'layout'
        : 'route';

export function nodeLabel(r: RouteInfo | undefined, id: string) {
  const kind = kindOf(r, id);
  if (kind === 'root') return 'root';
  if (kind === 'index') return '(index)';
  if (kind === 'layout') return '(layout)';
  return r?.path ?? '…';
}

/* ------------------------------------------------------------ components */

const svg = (children: ReactNode) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

export const Icon = {
  page: svg(
    <>
      <path d="M12 2 2 7l10 5 10-5-10-5Z" />
      <path d="m2 17 10 5 10-5" />
      <path d="m2 12 10 5 10-5" />
    </>,
  ),
  network: svg(<path d="M3 12h4l3-8 4 16 3-8h4" />),
  routes: svg(
    <>
      <circle cx="6" cy="5" r="2" />
      <circle cx="6" cy="19" r="2" />
      <circle cx="18" cy="12" r="2" />
      <path d="M6 7v10M6 12h10" />
    </>,
  ),
};

/** Middleware, loader and action flags, as compact letters. */
export function Handlers({ r }: { r?: RouteInfo }) {
  if (!r || !(r.hasMiddleware || r.hasLoader || r.hasAction)) return null;
  return (
    <span className="pdt-handlers">
      {r.hasMiddleware && (
        <abbr
          className="M"
          title={
            r.middleware?.length
              ? `middleware: ${r.middleware.map((n, i) => n || `#${i + 1}`).join(', ')}`
              : 'middleware'
          }
        >
          M
        </abbr>
      )}
      {r.hasLoader && (
        <abbr className="L" title="loader">
          L
        </abbr>
      )}
      {r.hasAction && (
        <abbr className="A" title="action">
          A
        </abbr>
      )}
    </span>
  );
}

export function AddonChip({ addon }: { addon?: string }) {
  if (!addon) return null;
  return (
    <span
      className={`
        pdt-chip
        ${addon === 'app' ? 'app' : ''}
      `}
    >
      {addon}
    </span>
  );
}

export function Method({ method }: { method?: string }) {
  const m = (method ?? 'GET').toUpperCase();
  return (
    <span
      className={`
        pdt-method
        ${m}
      `}
    >
      {m}
    </span>
  );
}

export function Status({ code }: { code?: number }) {
  return (
    <span
      className={`
        pdt-status
        ${statusClass(code)}
      `}
    >
      {code ?? '…'}
    </span>
  );
}

export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: [T, string][];
  onChange: (v: T) => void;
}) {
  return (
    <div className="pdt-seg-ctl" role="group" aria-label={label}>
      {options.map(([v, text]) => (
        <button
          key={v}
          type="button"
          aria-pressed={value === v}
          onClick={() => onChange(v)}
        >
          {text}
        </button>
      ))}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="pdt-empty">{children}</div>;
}

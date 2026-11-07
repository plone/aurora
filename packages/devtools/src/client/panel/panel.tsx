/**
 * The Plone devtools panel: Active page, Network and Routes.
 */
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { BackendCall, RouteInfo, Timing } from '../../events';
import { client } from '../client';
import { JsonTree } from './json-tree';
import { css } from './styles';

/* ------------------------------------------------------------------ data */

type RouterState = {
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
const getRouter = () =>
  (window as unknown as { __reactRouterDataRouter?: DataRouter })
    .__reactRouterDataRouter;

function useRouterState() {
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

function useDevtoolsEvents() {
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

const fmtMs = (a: number, b?: number) =>
  b === undefined ? '…' : b - a < 1 ? '<1 ms' : `${Math.round(b - a)} ms`;
const fmtBytes = (n?: number) =>
  n === undefined ? '' : n < 1024 ? `${n} B` : `${(n / 1024).toFixed(1)} kB`;
const pathOf = (url?: string) => {
  if (!url) return '';
  try {
    const u = new URL(url);
    return decodeURIComponent(u.pathname + u.search);
  } catch {
    return url;
  }
};
const statusClass = (s?: number) =>
  !s ? '' : s >= 400 ? 'err' : s >= 300 ? 'redirect' : 'ok';
const shortId = (id?: string) =>
  id && id.startsWith('/') ? id.split('/').slice(-3).join('/') : (id ?? '');

function routeLabel(routes: Map<string, RouteInfo>, id?: string) {
  const r = id ? routes.get(id) : undefined;
  return r?.source?.replace(/\.[jt]sx?$/, '') ?? shortId(id);
}

const Icon = {
  page: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M12 2 2 7l10 5 10-5-10-5Z" />
      <path d="m2 17 10 5 10-5" />
      <path d="m2 12 10 5 10-5" />
    </svg>
  ),
  network: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M3 12h4l3-8 4 16 3-8h4" />
    </svg>
  ),
  routes: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="6" cy="5" r="2" />
      <circle cx="6" cy="19" r="2" />
      <circle cx="18" cy="12" r="2" />
      <path d="M6 7v10M6 12h10" />
    </svg>
  ),
};

function Badges({ r }: { r?: RouteInfo }) {
  if (!r) return null;
  return (
    <>
      {r.addon && (
        <span
          className={`
            pdt-badge
            ${r.addon === 'app' ? 'app' : 'addon'}
          `}
        >
          {r.addon}
        </span>
      )}
      {r.hasMiddleware && (
        <span className="pdt-badge M" title="middleware">
          M
        </span>
      )}
      {r.hasLoader && (
        <span className="pdt-badge L" title="loader">
          L
        </span>
      )}
      {r.hasAction && (
        <span className="pdt-badge A" title="action">
          A
        </span>
      )}
    </>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="pdt-seg-section">
      <span>{title}</span>
      {children}
    </div>
  );
}

/* ----------------------------------------------------------- active page */

function ActivePage({
  state,
  routes,
  timings,
}: {
  state?: RouterState;
  routes: Map<string, RouteInfo>;
  timings: Timing[];
}) {
  const clientEvents = timings
    .filter((t) => t.side === 'client')
    .sort((a, b) => b.start - a.start);
  return (
    <>
      <div className="pdt-head">
        <h2>Active route segments</h2>
        <span className="mono pdt-muted">
          {state?.location.pathname}
          {state?.location.search}
        </span>
        <span className="spacer" />
        <span className="pdt-tag">{state?.navigation.state ?? '…'}</span>
        <button className="pdt-btn" onClick={() => getRouter()?.revalidate()}>
          Revalidate
        </button>
      </div>
      <div className="pdt-body">
        <div className="pdt-scroll">
          {!state && <div className="pdt-empty">Waiting for the router…</div>}
          {state?.matches.map((m, i) => {
            const r = routes.get(m.route.id);
            const kind =
              m.route.id === 'root'
                ? 'root'
                : r?.index
                  ? 'index'
                  : r && r.path === undefined
                    ? 'layout'
                    : 'route';
            const loaderData = state.loaderData[m.route.id];
            const actionData = state.actionData?.[m.route.id];
            return (
              <div className="pdt-seg" key={m.route.id}>
                <div
                  className={`
                    pdt-dot
                    ${kind}
                  `}
                  title={kind}
                >
                  {kind === 'root' ? 'R' : kind === 'layout' ? 'L' : i}
                </div>
                <div className="pdt-seg-title">
                  <span className="mono">
                    {kind === 'index'
                      ? '(index)'
                      : kind === 'layout'
                        ? '(layout)'
                        : kind === 'root'
                          ? '/'
                          : r?.path}
                  </span>
                  <Badges r={r} />
                </div>
                <div className="pdt-seg-file mono" title={m.route.id}>
                  {r?.source ?? m.route.id}
                </div>
                {Object.keys(m.params).length > 0 && (
                  <Section title="Params">
                    <JsonTree value={m.params} defaultOpenDepth={1} />
                  </Section>
                )}
                {loaderData !== undefined && (
                  <Section title="Loader data">
                    <JsonTree value={loaderData} defaultOpenDepth={0} />
                  </Section>
                )}
                {actionData !== undefined && (
                  <Section title="Action data">
                    <JsonTree value={actionData} defaultOpenDepth={1} />
                  </Section>
                )}
              </div>
            );
          })}
        </div>
        <div className="pdt-side">
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Timeline</div>
          {clientEvents.length === 0 && (
            <div className="pdt-muted">
              Navigations and fetchers show up here.
            </div>
          )}
          {clientEvents.map((t) => {
            const method = (t.method ?? 'GET').toUpperCase();
            const title =
              t.kind === 'fetch'
                ? `Fetcher ${method === 'GET' ? 'load' : 'submission'}`
                : method === 'GET'
                  ? 'Page navigation'
                  : 'Form submission';
            return (
              <div className="pdt-ev" key={t.id}>
                <div className="pdt-ev-title">
                  {title}
                  <span
                    className={`
                      pdt-method
                      ${method}
                    `}
                  >
                    {method}
                  </span>
                  <span className="spacer" />
                  <span className="pdt-muted">{fmtMs(t.start, t.end)}</span>
                </div>
                <div className="mono pdt-muted">{pathOf(t.url) || t.url}</div>
                {t.status === 'error' && (
                  <div className="pdt-status err">{t.error}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

/* --------------------------------------------------------------- network */

type Row =
  | { type: 'handler'; t: Timing; label: string; level: number }
  | { type: 'call'; c: BackendCall; level: number };

function buildRows(
  req: Timing,
  timings: Timing[],
  calls: BackendCall[],
  routes: Map<string, RouteInfo>,
  showAll: boolean,
): Row[] {
  const handlers = timings
    .filter(
      (t) =>
        t.side === 'server' &&
        t.kind !== 'request' &&
        t.requestId === req.requestId,
    )
    .sort((a, b) => a.start - b.start || b.end - a.end);
  const reqCalls = calls
    .filter((c) => c.requestId === req.requestId)
    .sort((a, b) => a.start - b.start);
  // Attach each call to the innermost handler of the same route that spans it.
  const owner = new Map<string, string>();
  for (const c of reqCalls) {
    const spanning = handlers
      .filter(
        (h) =>
          h.routeId === c.routeId &&
          h.start <= c.start + 0.5 &&
          h.end >= (c.end ?? c.start) - 0.5,
      )
      .sort((a, b) => a.end - a.start - (b.end - b.start));
    if (spanning[0]) owner.set(c.id, spanning[0].id);
  }
  const counter = new Map<string, number>();
  const rows: Row[] = [];
  for (const h of handlers) {
    const key = `${h.kind}:${h.routeId}`;
    const n = (counter.get(key) ?? 0) + 1;
    counter.set(key, n);
    const own = reqCalls.filter((c) => owner.get(c.id) === h.id);
    if (
      !showAll &&
      h.kind === 'middleware' &&
      own.length === 0 &&
      h.end - h.start < 1
    )
      continue;
    const label = `${h.kind}${h.kind === 'middleware' ? ` #${n}` : ''} · ${routeLabel(routes, h.routeId)}`;
    rows.push({ type: 'handler', t: h, label, level: 2 });
    for (const c of own) rows.push({ type: 'call', c, level: 3 });
  }
  for (const c of reqCalls.filter((x) => !owner.has(x.id))) {
    rows.push({ type: 'call', c, level: 2 });
  }
  return rows;
}

function Bar({
  from,
  to,
  start,
  end,
  cls,
}: {
  from: number;
  to: number;
  start: number;
  end?: number;
  cls: string;
}) {
  const span = Math.max(to - from, 1);
  const left = Math.max(0, ((start - from) / span) * 100);
  const width = Math.max(0.5, (((end ?? to) - start) / span) * 100);
  return (
    <div className="pdt-bar">
      <i
        className={cls}
        style={{ left: `${left}%`, width: `${Math.min(width, 100 - left)}%` }}
      />
    </div>
  );
}

function Network({
  timings,
  calls,
  routes,
  clear,
}: {
  timings: Timing[];
  calls: BackendCall[];
  routes: Map<string, RouteInfo>;
  clear: () => void;
}) {
  const [filter, setFilter] = useState('');
  const [internals, setInternals] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [selected, setSelected] = useState<string>();
  const [selectedCall, setSelectedCall] = useState<string>();
  const [bodyTab, setBodyTab] = useState<'response' | 'request'>('response');

  const requests = timings
    .filter((t) => t.kind === 'request')
    .filter((t) => internals || !pathOf(t.url).startsWith('/__manifest'))
    .filter((t) => !filter || pathOf(t.url).includes(filter))
    .sort((a, b) => a.start - b.start);
  const maxDur = Math.max(1, ...requests.map((r) => r.end - r.start));
  const req = requests.find((r) => r.id === selected) ?? requests.at(-1);
  const rows = req ? buildRows(req, timings, calls, routes, showAll) : [];
  const call = calls.find(
    (c) => c.id === selectedCall && c.requestId === req?.requestId,
  );

  return (
    <>
      <div className="pdt-head">
        <h2>Network</h2>
        <input
          className="pdt-filter"
          placeholder="Filter by path"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <button
          className="pdt-btn"
          aria-pressed={internals}
          onClick={() => setInternals(!internals)}
        >
          __manifest
        </button>
        <button
          className="pdt-btn"
          aria-pressed={showAll}
          onClick={() => setShowAll(!showAll)}
        >
          All middleware
        </button>
        <span className="spacer" />
        <button className="pdt-btn" onClick={clear}>
          Clear
        </button>
      </div>
      <div className="pdt-net">
        <div className="pdt-reqs" aria-label="Requests">
          {requests.length === 0 && (
            <div className="pdt-empty">
              No server requests yet. Load or navigate a page.
            </div>
          )}
          {requests.map((r) => {
            const p = pathOf(r.url);
            const n = calls.filter((c) => c.requestId === r.requestId).length;
            return (
              <button
                type="button"
                key={r.id}
                className="pdt-req"
                aria-pressed={r.id === req?.id}
                onClick={() => {
                  setSelected(r.id);
                  setSelectedCall(undefined);
                }}
              >
                <span
                  className={`
                    pdt-method
                    ${r.method}
                  `}
                >
                  {r.method}
                </span>
                <span className="url mono" title={p}>
                  {p.replace(/\.data(\?|$)/, '$1')}{' '}
                  <span className="pdt-tag">
                    {/\.data(\?|$)/.test(p)
                      ? 'data'
                      : p.startsWith('/__manifest')
                        ? 'manifest'
                        : 'document'}
                  </span>
                  {n > 0 && <span className="pdt-muted"> · {n} api</span>}
                </span>
                <span
                  className={`
                    pdt-status
                    ${statusClass(r.statusCode)}
                  `}
                >
                  {r.statusCode}
                </span>
                <span className="dur pdt-muted">{fmtMs(r.start, r.end)}</span>
                <Bar
                  from={r.start}
                  to={r.start + maxDur}
                  start={r.start}
                  end={r.end}
                  cls={r.status === 'error' ? 'c-error' : 'c-request'}
                />
              </button>
            );
          })}
        </div>
        <div className="pdt-detail">
          {req ? (
            <>
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  alignItems: 'baseline',
                  flexWrap: 'wrap',
                }}
              >
                <span
                  className={`
                    pdt-method
                    ${req.method}
                  `}
                >
                  {req.method}
                </span>
                <span className="mono" style={{ fontWeight: 600 }}>
                  {pathOf(req.url)}
                </span>
                <span
                  className={`
                    pdt-status
                    ${statusClass(req.statusCode)}
                  `}
                >
                  {req.statusCode}
                </span>
                <span className="pdt-muted">{fmtMs(req.start, req.end)}</span>
              </div>
              <div className="pdt-legend">
                <span>
                  <i className="c-middleware" />
                  middleware
                </span>
                <span>
                  <i className="c-loader" />
                  loader
                </span>
                <span>
                  <i className="c-action" />
                  action
                </span>
                <span>
                  <i className="c-backend" />
                  backend call
                </span>
              </div>
              <div className="pdt-wf">
                {rows.map((row) =>
                  row.type === 'handler' ? (
                    <Frag key={row.t.id}>
                      <span
                        className={`
                          lbl
                          l${row.level}
                          mono
                        `}
                        title={row.t.routeId}
                      >
                        {row.label}
                      </span>
                      <Bar
                        from={req.start}
                        to={req.end}
                        start={row.t.start}
                        end={row.t.end}
                        cls={
                          row.t.status === 'error'
                            ? 'c-error'
                            : `c-${row.t.kind}`
                        }
                      />
                      <span className="dur pdt-muted">
                        {fmtMs(row.t.start, row.t.end)}
                      </span>
                    </Frag>
                  ) : (
                    <Frag key={row.c.id}>
                      <button
                        className={`
                          lbl
                          l${row.level}
                          mono
                          ${row.c.id === call?.id ? 'sel' : ''}
                        `}
                        title={row.c.url}
                        onClick={() => setSelectedCall(row.c.id)}
                      >
                        <span
                          className={`
                            pdt-method
                            ${row.c.method}
                          `}
                        >
                          {row.c.method}
                        </span>{' '}
                        {pathOf(row.c.url).replace(/^.*\+\+api\+\+/, '') || '/'}{' '}
                        <span
                          className={`
                            pdt-status
                            ${statusClass(row.c.statusCode)}
                          `}
                        >
                          {row.c.statusCode ?? '…'}
                        </span>
                      </button>
                      <Bar
                        from={req.start}
                        to={req.end}
                        start={row.c.start}
                        end={row.c.end}
                        cls={
                          (row.c.statusCode ?? 0) >= 400
                            ? 'c-error'
                            : 'c-backend'
                        }
                      />
                      <span className="dur pdt-muted">
                        {fmtMs(row.c.start, row.c.end)}
                      </span>
                    </Frag>
                  ),
                )}
              </div>
              {call ? (
                <div style={{ marginTop: 12 }}>
                  <div className="mono" style={{ wordBreak: 'break-all' }}>
                    <span
                      className={`
                        pdt-method
                        ${call.method}
                      `}
                    >
                      {call.method}
                    </span>{' '}
                    {call.url}
                  </div>
                  <div className="pdt-muted">
                    {call.statusCode} · {fmtMs(call.start, call.end)} ·{' '}
                    {fmtBytes(call.size)} · {call.contentType} · from{' '}
                    {routeLabel(routes, call.routeId)}
                    {call.truncated ? ' · truncated' : ''}
                  </div>
                  <div className="pdt-tabs">
                    <button
                      className="pdt-btn"
                      aria-pressed={bodyTab === 'response'}
                      onClick={() => setBodyTab('response')}
                    >
                      Response
                    </button>
                    <button
                      className="pdt-btn"
                      aria-pressed={bodyTab === 'request'}
                      onClick={() => setBodyTab('request')}
                      disabled={call.requestBody === undefined}
                    >
                      Request body
                    </button>
                  </div>
                  {bodyTab === 'response' || call.requestBody === undefined ? (
                    call.responseBody === undefined ? (
                      <div className="pdt-muted">Waiting for the response…</div>
                    ) : (
                      <JsonTree
                        value={call.responseBody}
                        defaultOpenDepth={1}
                      />
                    )
                  ) : (
                    <JsonTree value={call.requestBody} defaultOpenDepth={2} />
                  )}
                </div>
              ) : (
                rows.some((r) => r.type === 'call') && (
                  <div className="pdt-muted" style={{ marginTop: 12 }}>
                    Select a backend call to see its request and response.
                  </div>
                )
              )}
            </>
          ) : (
            <div className="pdt-empty">Select a request.</div>
          )}
        </div>
      </div>
    </>
  );
}

function Frag({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

/* ---------------------------------------------------------------- routes */

function nodeLabel(r: RouteInfo) {
  if (r.id === 'root') return 'root';
  if (r.index) return '(index)';
  return r.path === undefined ? '(layout)' : r.path;
}

function RouteRow({ route, active }: { route: RouteInfo; active: boolean }) {
  const color =
    route.id === 'root'
      ? 'var(--purple)'
      : route.path === undefined && !route.index
        ? 'var(--blue)'
        : 'var(--green)';
  return (
    <div
      className={`
        node
        ${active ? 'active' : ''}
      `}
      title={route.id}
    >
      <span className="pip" style={{ background: color }} />
      <span className="path mono">{nodeLabel(route)}</span>
      <Badges r={route} />
      <span className="file mono">{route.source}</span>
    </div>
  );
}

function RouteTree({
  parent,
  childrenOf,
  visible,
  active,
}: {
  parent?: string;
  childrenOf: Map<string | undefined, RouteInfo[]>;
  visible: (r: RouteInfo) => boolean;
  active: Set<string>;
}) {
  return (
    <>
      {(childrenOf.get(parent) ?? []).filter(visible).map((route) => (
        <div key={route.id}>
          <RouteRow route={route} active={active.has(route.id)} />
          {(childrenOf.get(route.id) ?? []).some(visible) && (
            <div className="children">
              <RouteTree
                parent={route.id}
                childrenOf={childrenOf}
                visible={visible}
                active={active}
              />
            </div>
          )}
        </div>
      ))}
    </>
  );
}

function RoutesTab({
  routes,
  active,
}: {
  routes: RouteInfo[];
  active: Set<string>;
}) {
  const [filter, setFilter] = useState('');
  const [addon, setAddon] = useState('');
  const [view, setView] = useState<'tree' | 'list'>('tree');
  const addons = [
    ...new Set(routes.map((r) => r.addon).filter(Boolean)),
  ] as string[];
  const matches = (r: RouteInfo) =>
    (!addon || r.addon === addon) &&
    (!filter ||
      [r.path, r.source, r.id].some((x) =>
        x?.toLowerCase().includes(filter.toLowerCase()),
      ));
  const children = useMemo(() => {
    const m = new Map<string | undefined, RouteInfo[]>();
    for (const r of routes)
      m.set(r.parentId, [...(m.get(r.parentId) ?? []), r]);
    return m;
  }, [routes]);
  const visible = (r: RouteInfo): boolean =>
    matches(r) || (children.get(r.id) ?? []).some(visible);

  return (
    <>
      <div className="pdt-head">
        <h2>Routes</h2>
        <span className="pdt-muted">{routes.length}</span>
        <input
          className="pdt-filter"
          placeholder="Filter path or file"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <select
          className="pdt-filter"
          value={addon}
          onChange={(e) => setAddon(e.target.value)}
        >
          <option value="">All add-ons</option>
          {addons.map((a) => (
            <option key={a}>{a}</option>
          ))}
        </select>
        <span className="spacer" />
        <button
          className="pdt-btn"
          aria-pressed={view === 'tree'}
          onClick={() => setView('tree')}
        >
          Tree
        </button>
        <button
          className="pdt-btn"
          aria-pressed={view === 'list'}
          onClick={() => setView('list')}
        >
          List
        </button>
      </div>
      <div className="pdt-scroll pdt-tree">
        {routes.length === 0 && (
          <div className="pdt-empty">Loading routes…</div>
        )}
        {view === 'tree' ? (
          <RouteTree
            parent={undefined}
            childrenOf={children}
            visible={visible}
            active={active}
          />
        ) : (
          routes
            .filter(matches)
            .map((r) => (
              <RouteRow key={r.id} route={r} active={active.has(r.id)} />
            ))
        )}
      </div>
    </>
  );
}

/* ----------------------------------------------------------------- panel */

type Tab = 'page' | 'network' | 'routes';

export function PloneDevtoolsPanel({
  theme = 'dark',
}: {
  theme?: 'light' | 'dark';
}) {
  const [tab, setTab] = useState<Tab>('page');
  const state = useRouterState();
  const { routes, timings, calls, clear } = useDevtoolsEvents();
  const routeMap = useMemo(
    () => new Map(routes.map((r) => [r.id, r])),
    [routes],
  );
  const active = new Set(state?.matches.map((m) => m.route.id));
  const nRequests = timings.filter((t) => t.kind === 'request').length;

  const rail: [Tab, string, ReactNode, number?][] = [
    ['page', 'Active page', Icon.page],
    ['network', 'Network', Icon.network, nRequests],
    ['routes', 'Routes', Icon.routes],
  ];
  return (
    <div className="pdt" data-theme={theme}>
      <style>{css}</style>
      <nav className="pdt-rail">
        {rail.map(([id, title, icon, count]) => (
          <button
            key={id}
            title={title}
            aria-label={title}
            aria-pressed={tab === id}
            onClick={() => setTab(id)}
          >
            {icon}
            {count ? <span className="count">{count}</span> : null}
          </button>
        ))}
      </nav>
      <main className="pdt-main" data-testid={`plone-devtools-${tab}`}>
        {tab === 'page' && (
          <ActivePage state={state} routes={routeMap} timings={timings} />
        )}
        {tab === 'network' && (
          <Network
            timings={timings}
            calls={calls}
            routes={routeMap}
            clear={clear}
          />
        )}
        {tab === 'routes' && <RoutesTab routes={routes} active={active} />}
      </main>
    </div>
  );
}

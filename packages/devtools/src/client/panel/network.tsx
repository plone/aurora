/**
 * Network: the requests the server handled, and for each one a waterfall of
 * its middleware, loaders, actions and the backend calls they made.
 */
import { useState, type ReactNode } from 'react';
import type { BackendCall, RouteInfo, Timing } from '../../events';
import { JsonTree } from './json-tree';
import {
  Empty,
  Method,
  Segmented,
  Status,
  fmtBytes,
  fmtMs,
  pathOf,
  routeLabel,
} from './shared';

type RequestKind = 'document' | 'data' | 'resource' | 'internal';

const DATA = /\.data(\?|$)/;

/** What a request is for: a page, a data request or the dev server's own. */
function requestKind(r: Timing): RequestKind {
  const p = pathOf(r.url);
  if (r.method === 'HEAD' || r.method === 'OPTIONS') return 'internal';
  if (p.startsWith('/__manifest')) return 'internal';
  if (DATA.test(p)) return 'data';
  // A resource route serving a file, such as `/@layers.css`.
  return /\.[a-z0-9]+(\?|$)/i.test(p) ? 'resource' : 'document';
}

/** The page a request is for: data requests name it with a `.data` suffix. */
const displayPath = (r: Timing) =>
  pathOf(r.url)
    .replace(DATA, '$1')
    .replace(/^\/_(\?|$)/, '/$1');

/** A backend call's path, after the `++api++` traversal. */
const apiPath = (c: BackendCall) =>
  pathOf(c.url).replace(/^.*\+\+api\+\+/, '') || '/';

type Row =
  | {
      type: 'handler';
      t: Timing;
      /** The middleware's function name, or `#n` when it has none. */
      name?: string;
      route: string;
      /** It awaits `next()`, so its time includes what runs after it. */
      wraps: boolean;
      level: 2;
    }
  | { type: 'call'; c: BackendCall; level: 2 | 3 };

export function buildRows(
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
    // Middleware run one after the other, so the nth run of a route's
    // middleware is the nth function of its `middleware` array.
    const name =
      h.kind === 'middleware'
        ? routes.get(h.routeId ?? '')?.middleware?.[n - 1] || `#${n}`
        : undefined;
    const wraps =
      h.kind === 'middleware' &&
      handlers.some((o) => o !== h && o.start >= h.start && o.end <= h.end);
    rows.push({
      type: 'handler',
      t: h,
      name,
      route: routeLabel(routes, h.routeId),
      wraps,
      level: 2,
    });
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

function Frag({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

function CallDetail({
  call,
  routes,
}: {
  call: BackendCall;
  routes: Map<string, RouteInfo>;
}) {
  const [tab, setTab] = useState<'response' | 'request'>('response');
  const hasRequest = call.requestBody !== undefined;
  const showing = tab === 'request' && hasRequest ? 'request' : 'response';
  return (
    <section className="pdt-call" aria-label="Backend call">
      <div className="pdt-call-head">
        <Method method={call.method} />
        <span className="u">{call.url}</span>
      </div>
      <div className="pdt-facts">
        <span>
          Status <Status code={call.statusCode} />
        </span>
        <span>
          Time <b>{fmtMs(call.start, call.end)}</b>
        </span>
        {call.size !== undefined && (
          <span>
            Size <b>{fmtBytes(call.size)}</b>
          </span>
        )}
        {call.contentType && (
          <span>
            Type <b>{call.contentType.split(';')[0]}</b>
          </span>
        )}
        <span>
          From <b className="mono">{routeLabel(routes, call.routeId)}</b>
        </span>
        {call.truncated && <span className="pdt-pill err">truncated</span>}
      </div>
      <div className="pdt-call-tabs">
        <button
          type="button"
          aria-pressed={showing === 'response'}
          onClick={() => setTab('response')}
        >
          Response
        </button>
        <button
          type="button"
          aria-pressed={showing === 'request'}
          onClick={() => setTab('request')}
          disabled={!hasRequest}
        >
          Request body
        </button>
      </div>
      <div className="pdt-call-body">
        {showing === 'request' ? (
          <JsonTree value={call.requestBody} defaultOpenDepth={2} />
        ) : call.responseBody === undefined ? (
          <span className="pdt-muted">Waiting for the response…</span>
        ) : (
          <JsonTree value={call.responseBody} defaultOpenDepth={1} />
        )}
      </div>
    </section>
  );
}

function Waterfall({
  req,
  rows,
  selected,
  onSelect,
}: {
  req: Timing;
  rows: Row[];
  selected?: string;
  onSelect: (id: string) => void;
}) {
  const total = req.end - req.start;
  const kinds = new Set(
    rows.map((r) => (r.type === 'call' ? 'backend' : r.t.kind)),
  );
  const legend = (
    [
      ['middleware', 'Middleware'],
      ['loader', 'Loader'],
      ['action', 'Action'],
      ['backend', 'Backend call'],
    ] as const
  ).filter(([k]) => kinds.has(k));
  return (
    <>
      {legend.length > 0 && (
        <div className="pdt-legend">
          {legend.map(([k, text]) => (
            <span key={k}>
              <i
                className={`
                  c-${k}
                `}
              />
              {text}
            </span>
          ))}
        </div>
      )}
      <div className="pdt-wf">
        {rows.length > 0 && (
          <>
            <span />
            <div className="axis" aria-hidden="true">
              <span>0</span>
              <span>{fmtMs(0, total / 2)}</span>
              <span>{fmtMs(0, total)}</span>
            </div>
            <span />
          </>
        )}
        {rows.map((row) =>
          row.type === 'handler' ? (
            <Frag key={row.t.id}>
              <span className="lbl" title={row.t.routeId}>
                {row.name ? (
                  <span className="name mono">{row.name}</span>
                ) : (
                  <span className="kind">{row.t.kind}</span>
                )}
                <span className="t mono pdt-muted">{row.route}</span>
                {row.wraps && (
                  <abbr
                    className="pdt-wraps"
                    title="Awaits next(): its time includes the middleware and loaders that run after it"
                  >
                    wraps
                  </abbr>
                )}
              </span>
              <Bar
                from={req.start}
                to={req.end}
                start={row.t.start}
                end={row.t.end}
                cls={
                  row.t.status === 'error'
                    ? 'c-error'
                    : `c-${row.t.kind}${row.wraps ? ' wraps' : ''}`
                }
              />
              <span className="dur">{fmtMs(row.t.start, row.t.end)}</span>
            </Frag>
          ) : (
            <Frag key={row.c.id}>
              <button
                type="button"
                className={`
                  lbl
                  l${row.level}
                `}
                title={row.c.url}
                aria-pressed={row.c.id === selected}
                onClick={() => onSelect(row.c.id)}
              >
                <Method method={row.c.method} />
                <span className="t mono">{apiPath(row.c)}</span>
                <Status code={row.c.statusCode} />
              </button>
              <Bar
                from={req.start}
                to={req.end}
                start={row.c.start}
                end={row.c.end}
                cls={(row.c.statusCode ?? 0) >= 400 ? 'c-error' : 'c-backend'}
              />
              <span className="dur">{fmtMs(row.c.start, row.c.end)}</span>
            </Frag>
          ),
        )}
        {rows.length === 0 && (
          <span className="hint">
            No middleware, loader or backend call recorded for this request.
          </span>
        )}
      </div>
    </>
  );
}

export function Network({
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
  const [type, setType] = useState<'all' | 'document' | 'data'>('all');
  const [internals, setInternals] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [selected, setSelected] = useState<string>();
  const [selectedCall, setSelectedCall] = useState<string>();

  const requests = timings
    .filter((t) => t.kind === 'request')
    .filter((t) => {
      const kind = requestKind(t);
      if (kind === 'internal') return internals;
      return type === 'all' || kind === type;
    })
    .filter((t) => !filter || pathOf(t.url).includes(filter))
    // Newest first.
    .sort((a, b) => b.start - a.start);
  const maxDur = Math.max(1, ...requests.map((r) => r.end - r.start));
  // By default the newest page or data request, not a stylesheet it loaded.
  const req =
    requests.find((r) => r.id === selected) ??
    requests.find((r) => requestKind(r) !== 'resource') ??
    requests[0];
  const rows = req ? buildRows(req, timings, calls, routes, showAll) : [];
  const call = calls.find(
    (c) => c.id === selectedCall && c.requestId === req?.requestId,
  );
  const apiCount = (r: Timing) =>
    calls.filter((c) => c.requestId === r.requestId).length;

  return (
    <>
      <div className="pdt-head">
        <h2>Network</h2>
        <input
          className="pdt-input"
          placeholder="Filter by path"
          aria-label="Filter by path"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <Segmented
          label="Request type"
          value={type}
          onChange={setType}
          options={[
            ['all', 'All'],
            ['document', 'Documents'],
            ['data', 'Data'],
          ]}
        />
        <span className="spacer" />
        <button
          type="button"
          className="pdt-btn"
          aria-pressed={internals}
          title="HEAD requests and the route manifest"
          onClick={() => setInternals(!internals)}
        >
          Internal
        </button>
        <button
          type="button"
          className="pdt-btn"
          aria-pressed={showAll}
          title="Also middleware that took under 1 ms and made no backend call"
          onClick={() => setShowAll(!showAll)}
        >
          All middleware
        </button>
        <button type="button" className="pdt-btn" onClick={clear}>
          Clear
        </button>
      </div>
      <div className="pdt-net">
        <div className="pdt-reqs" aria-label="Requests">
          {requests.length === 0 && (
            <Empty>No server requests yet. Load or navigate a page.</Empty>
          )}
          {requests.map((r) => {
            const kind = requestKind(r);
            const n = apiCount(r);
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
                <Method method={r.method} />
                <span className="url mono" title={pathOf(r.url)}>
                  <span className="p">{displayPath(r)}</span>
                  {kind !== 'document' && <span className="kind">{kind}</span>}
                  {n > 0 && <span className="api">{n} api</span>}
                </span>
                <Status code={r.statusCode} />
                <span className="dur">{fmtMs(r.start, r.end)}</span>
                <Bar
                  from={r.start}
                  to={r.start + maxDur}
                  start={r.start}
                  end={r.end}
                  cls={
                    r.status === 'error' || (r.statusCode ?? 0) >= 500
                      ? 'c-error'
                      : 'c-request'
                  }
                />
              </button>
            );
          })}
        </div>
        <div className="pdt-detail">
          {req ? (
            <>
              <div className="pdt-detail-head">
                <Method method={req.method} />
                <span className="p">{pathOf(req.url)}</span>
                <Status code={req.statusCode} />
                <span className="pdt-muted mono">
                  {fmtMs(req.start, req.end)}
                </span>
                <span className="pdt-pill">{requestKind(req)}</span>
              </div>
              <Waterfall
                req={req}
                rows={rows}
                selected={call?.id}
                onSelect={setSelectedCall}
              />
              {call ? (
                <CallDetail key={call.id} call={call} routes={routes} />
              ) : (
                rows.some((r) => r.type === 'call') && (
                  <Empty>
                    Select a backend call to see its request and response.
                  </Empty>
                )
              )}
            </>
          ) : (
            <Empty>Select a request.</Empty>
          )}
        </div>
      </div>
    </>
  );
}

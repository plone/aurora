/**
 * Active page: the matched route segments, with their params, loader data
 * and action data, and a timeline of client navigations and fetchers.
 */
import type { RouteInfo, Timing } from '../../events';
import { JsonTree } from './json-tree';
import {
  AddonChip,
  Handlers,
  Method,
  fmtMs,
  getRouter,
  kindOf,
  nodeLabel,
  pathOf,
  routeFile,
  type RouterState,
} from './shared';

function Timeline({ events }: { events: Timing[] }) {
  return (
    <aside className="pdt-side" aria-label="Timeline">
      <h3 className="pdt-label">Timeline</h3>
      {events.map((t) => {
        const method = (t.method ?? 'GET').toUpperCase();
        const submit = method !== 'GET';
        const title =
          t.kind === 'fetch'
            ? `Fetcher ${submit ? 'submission' : 'load'}`
            : submit
              ? 'Form submission'
              : 'Navigation';
        return (
          <div
            className={`
              pdt-ev
              ${t.status === 'error' ? 'error' : t.kind === 'fetch' ? 'fetch' : submit ? 'submit' : ''}
            `}
            key={t.id}
          >
            <div className="pdt-ev-title">
              {title}
              <Method method={method} />
              <span className="spacer" />
              <span className="pdt-muted mono">{fmtMs(t.start, t.end)}</span>
            </div>
            <div className="mono pdt-muted ellipsis" title={t.url}>
              {pathOf(t.url) || t.url}
            </div>
            {t.status === 'error' && (
              <div className="pdt-status err">{t.error}</div>
            )}
          </div>
        );
      })}
    </aside>
  );
}

export function ActivePage({
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
  const nav = state?.navigation.state;
  return (
    <>
      <div className="pdt-head">
        <h2>Active page</h2>
        <span className="mono pdt-muted ellipsis">
          {state?.location.pathname}
          {state?.location.search}
        </span>
        <span className="spacer" />
        <span
          className={`
            pdt-pill
            ${nav === 'idle' ? 'ok' : nav ? 'info' : ''}
          `}
        >
          {nav ?? '…'}
        </span>
        <button
          type="button"
          className="pdt-btn"
          onClick={() => getRouter()?.revalidate()}
        >
          Revalidate
        </button>
      </div>
      <div className="pdt-body">
        <div className="pdt-scroll">
          {!state && <div className="pdt-empty">Waiting for the router…</div>}
          <div className="pdt-segs">
            {state?.matches.map((m, i) => {
              const id = m.route.id;
              const r = routes.get(id);
              const kind = kindOf(r, id);
              const loaderData = state.loaderData[id];
              const actionData = state.actionData?.[id];
              const params = Object.keys(m.params).length > 0;
              const empty =
                !params && loaderData === undefined && actionData === undefined;
              return (
                <section className="pdt-segcard" key={id}>
                  <header>
                    <span
                      className={`
                        pdt-dot
                        ${kind}
                      `}
                      title={kind}
                    >
                      {kind === 'root' ? 'R' : i}
                    </span>
                    <span className="path">{nodeLabel(r, id)}</span>
                    <Handlers r={r} />
                    <AddonChip addon={r?.addon} />
                    <span className="spacer" />
                    <span className="file mono ellipsis" title={id}>
                      {routeFile(r, id)}
                    </span>
                  </header>
                  {!empty && (
                    <div className="sections">
                      {params && (
                        <div>
                          <div className="pdt-label">Params</div>
                          <JsonTree value={m.params} defaultOpenDepth={1} />
                        </div>
                      )}
                      {loaderData !== undefined && (
                        <div>
                          <div className="pdt-label">Loader data</div>
                          <JsonTree value={loaderData} defaultOpenDepth={1} />
                        </div>
                      )}
                      {actionData !== undefined && (
                        <div>
                          <div className="pdt-label">Action data</div>
                          <JsonTree value={actionData} defaultOpenDepth={1} />
                        </div>
                      )}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        </div>
        {/* Only once there is something to show: it is empty on a first load. */}
        {clientEvents.length > 0 && <Timeline events={clientEvents} />}
      </div>
    </>
  );
}

/**
 * Routes: every route of the app, as a tree or grouped by the add-on that
 * contributed it.
 */
import { useMemo, useState } from 'react';
import type { RouteInfo } from '../../events';
import {
  AddonChip,
  Empty,
  Handlers,
  Segmented,
  kindOf,
  nodeLabel,
} from './shared';

/** The route's file, without the add-on's own name in front. */
const fileIn = (r: RouteInfo) =>
  r.source && r.addon && r.addon !== 'app' && r.source.startsWith(`${r.addon}/`)
    ? r.source.slice(r.addon.length + 1)
    : r.source;

/** The URL pattern of a route: its path joined to its parents' paths. */
function fullPath(r: RouteInfo, byId: Map<string, RouteInfo>): string {
  const parts: string[] = [];
  for (let x: RouteInfo | undefined = r; x; x = byId.get(x.parentId ?? '')) {
    if (x.path) parts.unshift(x.path.replace(/^\/|\/$/g, ''));
  }
  return `/${parts.filter(Boolean).join('/')}`;
}

function RouteRow({
  route,
  active,
  label,
  showAddon,
  dimLabel,
}: {
  route: RouteInfo;
  active: boolean;
  label: string;
  showAddon: boolean;
  dimLabel?: boolean;
}) {
  const kind = kindOf(route, route.id);
  return (
    <div
      className={`
        node
        ${active ? 'active' : ''}
      `}
      title={route.id}
    >
      <span
        className={`
          pip
          ${kind}
        `}
        title={kind}
      />
      <span
        className={`
          path
          ${dimLabel ? 'dim' : ''}
        `}
      >
        {label}
      </span>
      <Handlers r={route} />
      {showAddon && <AddonChip addon={route.addon} />}
      <span className="file mono ellipsis">
        {showAddon ? route.source : fileIn(route)}
      </span>
    </div>
  );
}

function RouteTree({
  parent,
  childrenOf,
  visible,
  active,
}: {
  parent?: RouteInfo;
  childrenOf: Map<string | undefined, RouteInfo[]>;
  visible: (r: RouteInfo) => boolean;
  active: Set<string>;
}) {
  return (
    <>
      {(childrenOf.get(parent?.id) ?? []).filter(visible).map((route) => {
        const label = nodeLabel(route, route.id);
        return (
          <div key={route.id}>
            <RouteRow
              route={route}
              active={active.has(route.id)}
              label={label}
              // Only where the add-on changes, not on every row.
              showAddon={route.addon !== parent?.addon}
              dimLabel={label.startsWith('(')}
            />
            {(childrenOf.get(route.id) ?? []).some(visible) && (
              <div className="children">
                <RouteTree
                  parent={route}
                  childrenOf={childrenOf}
                  visible={visible}
                  active={active}
                />
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

export function RoutesTab({
  routes,
  active,
}: {
  routes: RouteInfo[];
  active: Set<string>;
}) {
  const [filter, setFilter] = useState('');
  const [addon, setAddon] = useState('');
  const [view, setView] = useState<'tree' | 'addon'>('tree');
  const byId = useMemo(() => new Map(routes.map((r) => [r.id, r])), [routes]);
  const childrenOf = useMemo(() => {
    const m = new Map<string | undefined, RouteInfo[]>();
    for (const r of routes)
      m.set(r.parentId, [...(m.get(r.parentId) ?? []), r]);
    return m;
  }, [routes]);
  const addons = [
    ...new Set(routes.map((r) => r.addon).filter(Boolean)),
  ] as string[];

  const q = filter.toLowerCase();
  const matches = (r: RouteInfo) =>
    (!addon || r.addon === addon) &&
    (!q ||
      [fullPath(r, byId), r.source, r.id].some((x) =>
        x?.toLowerCase().includes(q),
      ));
  const visible = (r: RouteInfo): boolean =>
    matches(r) || (childrenOf.get(r.id) ?? []).some(visible);
  const groups = addons
    .map((a) => ({
      addon: a,
      routes: routes
        .filter((r) => r.addon === a && matches(r))
        .sort((x, y) => fullPath(x, byId).localeCompare(fullPath(y, byId))),
    }))
    .filter((g) => g.routes.length > 0);

  return (
    <>
      <div className="pdt-head">
        <h2>
          Routes <span className="count">{routes.length}</span>
        </h2>
        <input
          className="pdt-input"
          placeholder="Filter by URL or file"
          aria-label="Filter by URL or file"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <select
          className="pdt-input"
          aria-label="Add-on"
          value={addon}
          onChange={(e) => setAddon(e.target.value)}
        >
          <option value="">All add-ons</option>
          {addons.map((a) => (
            <option key={a}>{a}</option>
          ))}
        </select>
        <span className="spacer" />
        <Segmented
          label="View"
          value={view}
          onChange={setView}
          options={[
            ['tree', 'Tree'],
            ['addon', 'By add-on'],
          ]}
        />
      </div>
      <div className="pdt-scroll pdt-tree">
        {routes.length === 0 && <Empty>Loading routes…</Empty>}
        {view === 'tree' ? (
          <RouteTree
            childrenOf={childrenOf}
            visible={visible}
            active={active}
          />
        ) : (
          groups.map((g) => (
            <section className="pdt-group" key={g.addon}>
              <h3>
                <AddonChip addon={g.addon} />
                <span className="count">{g.routes.length}</span>
              </h3>
              {g.routes.map((r) => {
                const kind = kindOf(r, r.id);
                const label =
                  kind === 'route' || kind === 'index'
                    ? fullPath(r, byId)
                    : nodeLabel(r, r.id);
                return (
                  <RouteRow
                    key={r.id}
                    route={r}
                    active={active.has(r.id)}
                    label={label}
                    showAddon={false}
                    dimLabel={label.startsWith('(')}
                  />
                );
              })}
            </section>
          ))
        )}
        {routes.length > 0 &&
          (view === 'tree'
            ? !routes.some((r) => !r.parentId && visible(r))
            : groups.length === 0) && <Empty>No route matches.</Empty>}
      </div>
    </>
  );
}

/**
 * The Plone devtools panel: Active page, Network and Routes.
 */
import { useMemo, useState, type ReactNode } from 'react';
import { ActivePage } from './active-page';
import { Network } from './network';
import { RoutesTab } from './routes-tab';
import { Icon, useDevtoolsEvents, useRouterState } from './shared';
import { css } from './styles';

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
      <nav className="pdt-rail" aria-label="Plone devtools">
        {rail.map(([id, title, icon, count]) => (
          <button
            type="button"
            key={id}
            title={title}
            aria-label={title}
            aria-pressed={tab === id}
            onClick={() => setTab(id)}
          >
            {icon}
            {count ? (
              <span className="count">{count > 99 ? '99+' : count}</span>
            ) : null}
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

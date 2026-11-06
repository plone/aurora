import { createRoot } from 'react-dom/client';
import { TanStackDevtools } from '@tanstack/react-devtools';
import { PloneDevtoolsPanel } from './panel/panel';

const ROOT_ID = 'plone-devtools';

/** Whether React has hydrated `<html>`: it marks the elements it hydrates. */
const htmlHydrated = () =>
  Object.keys(document.documentElement).some((key) =>
    key.startsWith('__reactFiber$'),
  );

function mount() {
  if (document.getElementById(ROOT_ID)) return;
  const el = document.createElement('div');
  el.id = ROOT_ID;
  document.body.appendChild(el);
  createRoot(el).render(
    <TanStackDevtools
      eventBusConfig={{ connectToServerBus: true }}
      plugins={[
        {
          name: 'Plone',
          render: (_el, props) => <PloneDevtoolsPanel theme={props.theme} />,
          defaultOpen: true,
        },
      ]}
    />,
  );
}

/**
 * Mounts TanStack Devtools with the Plone panel in a React root of its own,
 * appended to `<body>`, outside the app's tree. Call it before hydrating.
 *
 * - Nothing is added to the app's tree: `useId` values depend on the tree's
 *   shape, and the server rendered it without the devtools.
 * - It waits until React has hydrated `<html>`: TanStack Devtools sets an
 *   attribute on it, which would not match the server-rendered HTML.
 */
export function mountPloneDevtools({ timeout = 10_000 } = {}) {
  const started = Date.now();
  const tick = () => {
    if (htmlHydrated() || Date.now() - started > timeout) mount();
    else setTimeout(tick, 50);
  };
  tick();
}

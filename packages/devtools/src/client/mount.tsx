import { createRoot } from 'react-dom/client';
import { TanStackDevtools } from '@tanstack/react-devtools';
import { PloneDevtoolsPanel } from './panel/panel';

const ROOT_ID = 'plone-devtools';

/**
 * Mounts TanStack Devtools with the Plone panel in a React root of its own,
 * appended to `<body>`. It stays out of the app's hydration: Aurora's root
 * `Layout` returns the add-on's `<html>`, so it is no place for a portal.
 */
export function mountPloneDevtools() {
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

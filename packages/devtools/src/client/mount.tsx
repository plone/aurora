import { createRoot } from 'react-dom/client';
import { TanStackDevtools } from '@tanstack/react-devtools';
import { installFrameStyles } from './frame-styles';
import { auroraLogo } from './logo';
import { PloneDevtoolsPanel } from './panel/panel';

const ROOT_ID = 'plone-devtools';
const STATE_KEY = 'tanstack_devtools_state';

/**
 * On first use, start with TanStack's plugin strip folded (with a single
 * plugin it is an empty band that takes height from the panel) and with a
 * taller panel than TanStack's 400px, which leaves no room for a backend
 * call's details. TanStack merges a stored state over its defaults, so the
 * user's own changes win from then on.
 */
function seedFrameState() {
  try {
    if (localStorage.getItem(STATE_KEY) === null) {
      localStorage.setItem(
        STATE_KEY,
        JSON.stringify({
          subheaderCollapsed: true,
          height: Math.max(400, Math.round(window.innerHeight * 0.55)),
        }),
      );
    }
  } catch {
    // Storage may be unavailable (private mode, blocked site data).
  }
}

/**
 * The button that opens the devtools: the full Aurora mark at 48px, the
 * smallest size it is drawn for (TanStack's own button is 56px). TanStack
 * keeps its button around it, with dragging, positioning and its label.
 */
const trigger = (
  <img
    src={auroraLogo.full}
    alt=""
    width={48}
    height={48}
    // Explicit sizes: the app's own CSS (e.g. `img { max-width: 100% }`)
    // would otherwise shrink it inside TanStack's unsized button.
    style={{
      display: 'block',
      width: 48,
      height: 48,
      maxWidth: 'none',
      flex: 'none',
      // A drop shadow follows the drawn disc, which is slightly smaller than
      // the image; a box shadow would leave a ring of page between them.
      filter:
        'drop-shadow(0 1px 2px rgba(15, 37, 51, .3)) drop-shadow(0 2px 6px rgba(15, 37, 51, .15))',
    }}
  />
);

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
  seedFrameState();
  installFrameStyles();
  createRoot(el).render(
    <TanStackDevtools
      eventBusConfig={{ connectToServerBus: true }}
      config={{ customTrigger: trigger }}
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

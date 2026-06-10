---
myst:
  html_meta:
    "description": "How to show toast notifications in Plone Aurora using the @plone/layout toast framework."
    "property=og:description": "How to show toast notifications in Plone Aurora using the @plone/layout toast framework."
    "property=og:title": "Show toast notifications"
    "keywords": "Plone Aurora, Plone, toast, notification, react-aria-components, @plone/layout"
---

# Show toast notifications

Plone Aurora ships a global toast framework based on the `UNSTABLE_Toast` primitives from `react-aria-components`.
It is registered by `@plone/layout` and reachable from anywhere in the app via `@plone/registry`.
Use it to confirm successful actions, surface route errors, or report background-task progress.


## How the framework is wired

`@plone/layout/config/toast.ts` exports a module-level `ToastQueue<ToastItem>` and an `install()` function.
The queue wraps state updates in `document.startViewTransition` when the browser supports it, falling back to a plain update otherwise, so enter/exit animations stay in sync with React.
`install()` registers three utilities on `@plone/registry`:

- `{ type: 'toast', name: 'queue' }` returns the queue itself (useful when you need to subscribe or render your own region).
- `{ type: 'toast', name: 'show' }` adds a `ToastItem` to the queue and returns its key.
- `{ type: 'toast', name: 'dismiss' }` closes the toast identified by a key returned from `show`.

The visual `<Toast>` region is `@plone/layout/components/Toast/Toast.tsx`.
It is mounted once per layout, next to `<ScrollRestoration />` / `<Scripts />`, so toasts appear regardless of which route the user is on.
The shared CSS lives in `@plone/components/styles/basic/Toast.css`.
It defines:

- The region anchor (`.react-aria-ToastRegion`) and base toast container (`.react-aria-Toast`).
- Four visual variants picked up from the toast's `className`: the default (Quanta `denim`), `.success` (`turtle`), `.info` (`royal`), and `.error` (`wine`). All colors reference Quanta tokens with hex fallbacks so the styles render correctly outside a Quanta theme.
- The countdown bar (`.react-aria-Toast-progress`) rendered along the bottom edge of every timed toast.


## Show a toast

```ts
import config from '@plone/registry';

config.getUtility({ type: 'toast', name: 'show' }).method({
  title: 'Saved',
  description: 'Your changes have been saved.',
});
```

The fields on `ToastItem` are:

`title`
:   Required.
    Announced first by screen readers.

`description`
:   Optional supporting copy rendered below the title.

`icon`
:   Optional leading `ReactNode` rendered before the title.

`className`
:   Optional modifier class.
    Pass `'success'`, `'info'`, or `'error'` to use one of the variants that ship in `Toast.css`.
    Project add-ons can register their own classes for additional severities.

`showProgress`
:   Whether to render the auto-dismiss countdown bar at the bottom of the toast.
    Defaults to `true`.
    Pass `false` for short confirmations where the bar adds visual noise.
    Ignored for sticky toasts (`timeout: null`), which never render a bar because there is no countdown to draw.


## Customize the timeout

`show` accepts an options object as a second argument:

```ts
config.getUtility({ type: 'toast', name: 'show' }).method(
  { title: 'Uploading…', description: 'Hold on.' },
  { timeout: 8000 },
);
```

`timeout`
:   Auto-dismiss after `n` milliseconds.
    Defaults to `DEFAULT_TOAST_TIMEOUT_MS` (currently 6 seconds), exported from `@plone/layout/config/toast`.
    Pass `null` to require manual dismissal — useful for long-running operations that resolve via {ref}`dismiss <show-toasts-dismiss>`.
    react-aria-components recommends a minimum of 5 seconds so screen-reader users have time to read the announcement.

`onClose`
:   Fires when the toast is removed for any reason (auto-dismiss, close button, programmatic dismiss).


## Countdown bar

Every timed toast renders a thin progress bar pinned to its bottom edge.
The bar shrinks from full width to empty over the toast's `timeout`, giving the user a visual cue for how long the toast will remain on screen.

Behavior:

- Drawn as a single absolutely-positioned `<div>` inside the toast, clipped to the toast's rounded corners.
- Color is a lightening overlay (`rgba(255, 255, 255, 0.35)`) so it works against every variant background without per-variant styling.
- **Pauses on hover or focus**, mirroring react-aria's own pause-timers behavior.
- Never renders for sticky toasts (`timeout: null`) or when the caller sets `showProgress: false` on the item.
- Marked `aria-hidden` — it is decorative, not announced.


(show-toasts-dismiss)=

## Dismiss a toast programmatically

`show` returns an opaque `ToastKey`.
Pass it to the `dismiss` utility to remove the toast from code:

```ts
import config from '@plone/registry';

const show = config.getUtility({ type: 'toast', name: 'show' }).method;
const dismiss = config.getUtility({ type: 'toast', name: 'dismiss' }).method;

const key = show(
  { title: 'Uploading…' },
  { timeout: null },
);

// later, when the upload finishes:
dismiss(key);
```


## Surface route errors

`@plone/layout` exposes an `ErrorToast` helper for React Router error boundaries.
It reads the route error and pushes a styled toast.

```tsx
import config from '@plone/registry';
import ErrorToast from '@plone/layout/components/Toast/ErrorToast';

export function ErrorBoundary() {
  const queue = config.getUtility({ type: 'toast', name: 'queue' }).method();
  return ErrorToast(queue);
}
```


## Render your own region

The default `<Toast>` region covers the common case (bottom-center, dismissable, view-transition animations).
If you need a different layout — for example a side-panel region or a region scoped to a specific route — render `UNSTABLE_ToastRegion` directly and pass the shared queue:

```tsx
import {
  UNSTABLE_Toast as Toast,
  UNSTABLE_ToastContent as ToastContent,
  UNSTABLE_ToastRegion as ToastRegion,
} from 'react-aria-components';
import config from '@plone/registry';

function MyCustomRegion() {
  const queue = config.getUtility({ type: 'toast', name: 'queue' }).method();
  return (
    <ToastRegion queue={queue} aria-label="Background tasks">
      {({ toast }) => (
        <Toast toast={toast}>
          <ToastContent>{/* … */}</ToastContent>
        </Toast>
      )}
    </ToastRegion>
  );
}
```

Multiple regions can share the same queue.
Each rendered region receives every queued toast, so use them carefully — typically one global region per layout is enough.


## Where toasts appear today

The region is mounted in:

- `packages/cmsui/routes/layout.tsx` — every editor route
- `packages/publicui/routes/index.tsx` — every visitor-facing page
- `packages/contents/routes/layout.tsx` — the `/contents` UI

`@plone/layout` is installed by `@plone/aurora`, so the queue and utilities are available in any package that depends on it.

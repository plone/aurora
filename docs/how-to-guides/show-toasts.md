---
myst:
  html_meta:
    "description": "How to show toast notifications in Plone Aurora using the @plone/layout toast framework."
    "property=og:description": "How to show toast notifications in Plone Aurora using the @plone/layout toast framework."
    "property=og:title": "Show toast notifications"
    "keywords": "Plone Aurora, Plone, toast, notification, React Aria, @plone/layout"
---

# Show toast notifications

Plone Aurora ships a global toast framework based on the `UNSTABLE_Toast` primitives from React Aria Components.
It is registered by `@plone/layout` and reachable from anywhere in the app via `@plone/registry`.
Use it to confirm successful actions, surface route errors, or report background task progress.

See a [demo of toasts](https://plone-storybook.readthedocs.io/?path=/docs/layout_toast--docs).

For an explanation of how the framework is wired and where the region is mounted, see {doc}`../conceptual-guides/toasts`.


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
    Pass `'success'`, `'info'`, or `'error'` to use one of the variants that ship in {file}`Toast.css`.
    Project add-ons can register their own classes for additional toast alert styles.

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
:   An integer representing the duration in milliseconds after which a toast will be auto-dismissed.
    Defaults to the value set by `DEFAULT_TOAST_TIMEOUT_MS`, currently 6000 milliseconds, exported from {file}`layout/config/toast.ts`.
    Pass `null` to require manual dismissal, which is useful for long-running operations that resolve via {ref}`dismiss <show-toasts-dismiss>`.
    React Aria recommends a minimum of 5 seconds, so people who use a screen reader have time to read the announcement.

`onClose`
:   Fires when the toast is removed for any reason, including auto-dismiss, close button, and programmatic dismiss.


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

The default `<Toast>` region covers the common case, including bottom-center, dismissable, and view-transition animations.
For a different layout—for example, a side-panel region or a region scoped to a specific route—render `UNSTABLE_ToastRegion` directly, and pass the shared queue:

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
Each rendered region receives every queued toast, so use them carefully.
Typically, one global region per layout is enough.

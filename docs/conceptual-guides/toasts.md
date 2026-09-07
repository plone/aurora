---
myst:
  html_meta:
    "description": "An explanation of the toast notification framework in Plone Aurora, including its architecture, visual variants, and the countdown bar."
    "property=og:description": "An explanation of the toast notification framework in Plone Aurora, including its architecture, visual variants, and the countdown bar."
    "property=og:title": "Toast notifications"
    "keywords": "Plone Aurora, Plone, toast, notification, React Aria, @plone/layout"
---

# Toast notifications

Plone Aurora ships a global toast framework based on the `UNSTABLE_Toast` primitives from React Aria Components.
It is registered by `@plone/layout` and reachable from anywhere in the app via `@plone/registry`, so add-ons can confirm successful actions, surface route errors, or report background task progress without each one having to mount its own region.

See a [demo of toasts](https://plone-storybook.readthedocs.io/?path=/docs/layout_toast--docs).

For task-oriented guidance, see {doc}`../how-to-guides/show-toasts`.


## Architecture

The framework has three layers: a single shared queue, three registry utilities that wrap it, and a visual region that subscribes to the queue and renders each toast.


### The queue and registry utilities

In the package `@plone/layout`, its file {file}`packages/layout/config/toast.ts` exports a module-level `ToastQueue<ToastItem>` and an `install()` function.

The queue wraps state updates with the function `document.startViewTransition` when the browser supports it, falling back to a plain update otherwise.
Enter and exit animations stay in sync with React.

The `install()` function registers three utilities in `@plone/registry` for working with toasts:

`{ type: 'toast', name: 'queue' }`
:   Returns the queue itself.
    This is useful to subscribe or render a custom region.

`{ type: 'toast', name: 'show' }`
:   Adds a `ToastItem` to the queue and returns its key.

`{ type: 'toast', name: 'dismiss' }`
:   Closes the toast identified by a key returned from `show`.


### The region and CSS

The visual `<Toast>` region is defined in {file}`packages/layout/components/Toast/Toast.tsx`.
It's mounted once per layout, so toasts appear regardless of which route the user is on.

The shared CSS lives in {file}`components/src/styles/basic/Toast.css`.
It defines:

- The region anchor (`.react-aria-ToastRegion`) and base toast container (`.react-aria-Toast`).
- Four visual variants picked up from the toast's `className`: the default (Quanta `denim`), `.success` (`turtle`), `.info` (`royal`), and `.error` (`wine`).
  All colors reference Quanta tokens with hexadecimal fallbacks, so the styles render correctly outside a Quanta theme.
- The countdown bar (`.react-aria-Toast-progress`) rendered along the bottom edge of every timed toast.


## Countdown bar

Every timed toast renders a thin progress bar pinned to its bottom edge.
The bar shrinks from full width to empty over the toast's `timeout` duration, giving the user a visual cue for how long the toast will remain on screen.

A toast appears and behaves as described below.

- Drawn as a single absolutely-positioned `<div>` inside the toast, clipped to the toast's rounded corners.
- Background color is a lightening overlay, implemented with (`rgba(255, 255, 255, 0.35)`).
  It works against every variant background without per-variant styling.
- Pauses on hover or focus, mirroring React Aria's own pause-timers behavior.
- Never renders for sticky toasts, either declared with `timeout: null` or when the caller sets `showProgress: false` on the item.
- Marked `aria-hidden`, because it's decorative, not announced.


## Where toasts appear today

The region is mounted in the following files.

{file}`packages/cmsui/routes/layout.tsx`
:   every editor route

{file}`packages/publicui/routes/index.tsx`
:   every visitor-facing page

{file}`packages/contents/routes/layout.tsx`
:   the `/contents` UI

`@plone/layout` is installed by `@plone/aurora`, so the queue and utilities are available in any package that depends on it.

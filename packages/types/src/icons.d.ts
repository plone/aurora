/**
 * The component of a `*.svg?react` import, which the SVGR Vite plugin of
 * `@plone/icons` wraps in its `Icon` component. Its props are the ones of
 * the `*.svg?react` declaration in `modules.d.ts`.
 */
export type SVGReactComponent = typeof import('icon.svg?react').default;

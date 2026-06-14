export default function (config) {
  return {
    ...config,
    optimizeDeps: {
      ...config.optimizeDeps,
      include: [
        ...(config.optimizeDeps?.include ?? []),
        '@plone/layout > clsx',
        '@plone/layout > lodash.sortby',
        '@plone/layout > pretty-bytes',
        '@plone/layout > react-aria',
        '@plone/layout > react-aria-components',
        '@plone/layout > react-i18next',
        '@plone/layout > react-router',
        '@plone/layout > rrule',
      ],
    },
  };
}

export default function (config) {
  return {
    ...config,
    optimizeDeps: {
      ...config.optimizeDeps,
      include: [
        ...(config.optimizeDeps?.include ?? []),
        '@plone/layout > lodash.sortby',
        '@plone/layout > pretty-bytes',
        '@plone/layout > rrule',
      ],
    },
  };
}

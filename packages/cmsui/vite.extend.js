export default function (config) {
  return {
    ...config,
    optimizeDeps: {
      ...config.optimizeDeps,
      include: [
        ...(config.optimizeDeps?.include ?? []),
        '@plone/cmsui > jwt-decode',
        '@plone/cmsui > usehooks-ts',
      ],
    },
  };
}

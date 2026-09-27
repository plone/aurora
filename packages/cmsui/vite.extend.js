export default function (config) {
  return {
    ...config,
    optimizeDeps: {
      ...config.optimizeDeps,
      include: [
        ...(config.optimizeDeps?.include ?? []),
        '@plone/cmsui > @platejs/floating',
        '@plone/cmsui > @platejs/link/react',
        '@plone/cmsui > @tanstack/react-form',
        '@plone/cmsui > class-variance-authority',
        '@plone/cmsui > clsx',
        '@plone/cmsui > jotai',
        '@plone/cmsui > jotai-optics',
        '@plone/cmsui > jotai/utils',
        '@plone/cmsui > jwt-decode',
        '@plone/cmsui > lucide-react',
        '@plone/cmsui > platejs',
        '@plone/cmsui > platejs/react',
        '@plone/cmsui > react-aria',
        '@plone/cmsui > react-aria-components',
        '@plone/cmsui > react-i18next',
        '@plone/cmsui > react-router',
        '@plone/cmsui > rrule',
        '@plone/cmsui > tailwind-merge',
        '@plone/cmsui > tailwind-variants',
        '@plone/cmsui > usehooks-ts',
      ],
    },
  };
}

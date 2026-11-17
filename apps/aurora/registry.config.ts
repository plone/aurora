const addons = [
  '@plone/theming',
  '@plone/plate',
  '@plone/blocks',
  '@plone/layout',
  '@plone/cmsui',
  '@plone/publicui',
  '@plone/contents',
  '@plone/agave',
  // Blocks and fields for the acceptance and visual regression tests only.
  ...(process.env.PLONE_TEST_ADDON ? ['@plone/test-addon'] : []),
];
const theme = '';

export { addons, theme };

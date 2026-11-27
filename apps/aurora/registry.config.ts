import { addons as auroraAddons, theme } from '@plone/aurora/registry.config';

const addons = [
  ...auroraAddons,
  // Blocks and fields for the acceptance and visual regression tests only.
  ...(process.env.PLONE_TEST_ADDON ? ['@plone/test-addon'] : []),
];

export { addons, theme };

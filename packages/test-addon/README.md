# @plone/test-addon

A Plone Aurora add-on that only the acceptance and visual regression tests load.
It registers blocks and fields that the core doesn't ship, so the tests can exercise widgets and features in a real form.

It's private, and never published.

The app loads it only when the `PLONE_TEST_ADDON` environment variable is set when the app is built or started:

```shell
PLONE_TEST_ADDON=1 pnpm --filter @plone/aurora start:prod
```

## What it registers

- `objectListTest`: a block whose settings have an `object_list` field in each layout, `accordion` (`actions`) and `table` (`links`). It's restricted, so it never shows in the block chooser.

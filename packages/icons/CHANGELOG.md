# @plone/icons Release Notes

<!-- You should *NOT* be adding new change log entries to this file.
     You should create a file in the news directory instead.
     For helpful instructions, please see:
     https://6.docs.plone.org/volto/developer-guidelines/contributing.html#create-a-pull-request
-->

<!-- towncrier release notes start -->

## 1.0.0-alpha.3 (2026-10-29)

### Feature

- Add a mixer icon as an SVG and React component. @sneridagh 

## 1.0.0-alpha.2 (2026-10-29)

### Feature

- Added a Storybook, published at https://plone-icons.readthedocs.io/. It has the `Icon` stories moved from `@plone/components`, and a gallery of every icon. @pnicolli 
- Added a search filter to the Storybook icon gallery, so icons can be found by typing part of their name. @pnicolli 

### Internal

- Removed the test, spec, and story `exclude` entries from `tsconfig.json` that never matched any file, documenting that `check:ts` type-checks them. @sneridagh 
- Updated React Aria Components to 1.22, and moved all React Aria packages and `tailwindcss-react-aria-components` into the pnpm catalog. @sneridagh 

## 1.0.0-alpha.1 (2026-10-03)

### Feature

- Initial release of `@plone/icons`, containing the icon set, the `Icon` component and the SVGR Vite plugin previously shipped by `@plone/components`. @pnicolli

  Ship the base `Icon` styles as `@plone/icons/icons.css`. @pnicolli 

### Documentation

- Rewrote `docs/how-to-guides/icons.md` for the icon pipeline now living in `@plone/icons`. @pnicolli

  Documented the `@plone/icons/icons.css` import in `docs/how-to-guides/icons.md`, the `README.md` and the `docs/upgrade-guide/plone-components.md` upgrade guide. @pnicolli

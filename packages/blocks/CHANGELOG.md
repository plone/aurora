# @plone/blocks Release Notes

<!-- You should *NOT* be adding new change log entries to this file.
     You should create a file in the news directory instead.
     For helpful instructions, please see:
     https://6.docs.plone.org/volto/contributing/index.html
-->

<!-- towncrier release notes start -->

## 1.0.0-alpha.18 (2026-10-06)

### Breaking

- Removed the `video`, `audio`, `file` and `media_embed` entries from `config.blocks.plateBlocksConfig`, since Aurora's block editor no longer has those Plate nodes. @sneridagh 
- Renamed the Plone blocks' classnames to the block content contract, `block-<type>__<part>`, and moved the video and maps styles to `styles/content.css`. Update theme CSS that targets the old names: `image-block` is now `block-image__frame`; `video-block`, `video-inner` and `invalid-video-format` are `block-video__figure`, `__inner` and `__invalid`, and the video's `video align block <align>` wrapper is `block-video__wrapper` with `data-align`; `maps-block` and `maps-iframe` are `block-maps__frame` and `__iframe`; `teaser-item`, `teaser-image-wrapper` and `teaser-content` are `block-teaser__item`, `__image` and `__content`; the listing's `item` and `summary` are `block-listing__item` and `block-listing__item[data-variation='summary']`. New parts: `block-teaser__title`, `__description`, `block-listing__headline`, `__title`, `__description`, `__image`, `__body` and `__empty`. @sneridagh 

### Feature

- Moved the image block styles from a CSS Module to `styles/content.css`, so they load in both the Public UI and the CMSUI inside the `plone-content` cascade layer and themes can override them. The link around a linked image now has the `block-image__link` class. @sneridagh [#199](https://github.com/plone/aurora/pull/199)
- Added `h1` (category `text`) and `hr` (category `separator`) to `plateBlocksConfig`, so they get the block anatomy classnames. In the public view, the separator now gets the separator category spacing. @sneridagh 

### Internal

- Added Stylelint rules for `styles/content.css`: no `@layer`, and no `:root`, `html`, `body` or bare element selectors. @sneridagh [#200](https://github.com/plone/aurora/pull/200)

## 1.0.0-alpha.17 (2026-10-03)

### Internal

- Import icons from `@plone/icons`. @pnicolli 
- Removed the unused native Plate image (`img`) entry from `config.blocks.plateBlocksConfig`. @sneridagh 
- The `release` scripts now take the GitHub token from `gh auth token` when `GITHUB_TOKEN` is not set, and run `towncrier` with `uvx` instead of `pipx`. @sneridagh 

## 1.0.0-alpha.16 (2026-09-29)

### Bugfix

- Set the default block width of Heading 5 and Heading 6 to `narrow`, like the other headings. @sneridagh 

### Internal

- Removed the `h1` entry from `plateBlocksConfig`, since H1 is reserved for the title and the editor has no H1 plugin. @sneridagh 

## 1.0.0-alpha.15 (2026-09-29)

### Feature

- Added Maps block. @cihanandac 

## 1.0.0-alpha.14 (2026-09-21)

### Internal

- Updated package repository metadata and towncrier issue links from `plone/volto` to `plone/aurora`. @sneridagh 

## 1.0.0-alpha.13 (2026-09-16)

### Feature

- The image block now stores its alignment and size as schema-driven style fields, ships its styles as a CSS module instead of a global side-effect import, floats left/right aligned images at any size so following content wraps around them (including list markers), keeps floated images selectable in the editor, and can link the image to another page. @sneridagh @TimoBroeskamp 

## 1.0.0-alpha.12 (2026-09-05)

### Internal

- Declared the catalog-managed i18next version as a peer dependency to keep react-i18next instances unified. @sneridagh 
- Reformatted block components for compatibility with Prettier 3.8. @sneridagh 

## 1.0.0-alpha.11 (2026-07-02)

### Feature

- Added default Plate-native block categories for the shared block anatomy class contract. @sneridagh 

### Bugfix

- Update prop for objectBrowser. @sneridagh [#8246](https://github.com/plone/volto/pull/8246)
- Fix Teaser block object browser configuration: the target field now uses single selection mode, and the required item identifier is included in the selected attributes for both the target and image fields. @iFlameing 
- Keep block naming conventions as `<BlockName>BlockView.tsx` and `<BlockName>BlockEdit.tsx`. @frapell 

### Internal

- Unify Makefile files across the packages. @ionlizarazu 
- Updated TypeScript configuration to resolve Aurora app types from `@plone/aurora`. @sneridagh 

## 1.0.0-alpha.10 (2026-05-13)

### Internal

- Added first-class generic style field support while preserving `blockWidth` fallback for Plone blocks and explicit width handling for Plate-native blocks. @sneridagh 

## 1.0.0-alpha.9 (2026-05-08)

### Internal

- Registered the `blockWidth` style field definition utility to support the new generic style field runtime. @sneridagh 

## 1.0.0-alpha.8 (2026-05-07)

### Internal

- Added AGENTS.md file. @pnicolli 
- Aligned Blocks' local registration and TypeScript project setup with the monorepo-wide typecheck cleanup. 
- Switched Blocks' local `@testing-library/jest-dom` dev dependency to the shared catalog entry to keep test tooling aligned with the monorepo dependency refresh. 

## 1.0.0-alpha.7 (2026-04-16)

### Breaking

- Remove Text block from @plone/blocks, remove dependency on @plone/plate @sneridagh [#8015](https://github.com/plone/volto/pull/8015)
- Refactored and re-thinked blockWidth feature.
  Added widths to the existing block configs. @sneridagh [#8053](https://github.com/plone/volto/pull/8053)

### Feature

- Listing block @ebrehault [#7603](https://github.com/plone/volto/pull/7603)
- Somersault editor support. @sneridagh [#7921](https://github.com/plone/volto/pull/7921)
- Create video block view @tedw87 [#8004](https://github.com/plone/volto/pull/8004)

### Bugfix

- Use Image component in ImageBlockView instead of manually constructing image scale URLs. @jmevissen [#8008](https://github.com/plone/volto/pull/8008)
- Added default widths for plate headings. @sneridagh [#8076](https://github.com/plone/volto/pull/8076)

## 1.0.0-alpha.6 (2025-12-23)

### Feature

- Remove all slate related components. Use the new plate unified configuration in `@plone/plate`. @sneridagh [#7393](https://github.com/plone/volto/pull/7393)
- Added ESlint Tailwind plugin for prettifying and wrapping up the classNames in components.
  Amended components classNames by applying the plugin. @sneridagh [#7434](https://github.com/plone/volto/pull/7434)
- New slate `useStablePlateValue` for fixing SSR issues on converting on the fly legacy slate blocks. @sneridagh [#7650](https://github.com/plone/volto/pull/7650)

### Internal

- Fixed unused vars linting rule. Fixed all code that violated this rule. @sneridagh [#7395](https://github.com/plone/volto/pull/7395)

## 1.0.0-alpha.5 (2025-09-29)

### Breaking

- Remove circular dependency on layout<->blocks.
  Breaking: The `RenderBlocks` set of components are now under `@plone/layout/blocks`.
  Adjust the imports accordingly. @sneridagh [#7372](https://github.com/plone/volto/pull/7372)

### Feature

- Implement the BMv3 changes from the blocks edit PR. @sneridagh [#6393](https://github.com/plone/volto/pull/6393)
- Add Image component and use it in Teaser block. @avoinea [#6689](https://github.com/plone/volto/pull/6689)
- Improve unified `BlockWrapper`, block model v3 compatible. @danalvrz @sneridagh [#7228](https://github.com/plone/volto/pull/7228)
- Order blocks config into the accepted "best practice" for it. @sneridagh [#7346](https://github.com/plone/volto/pull/7346)

### Internal

- Adapt import to the rearrangement of the @plone/components package structure. @sneridagh [#7185](https://github.com/plone/volto/pull/7185)
- Update to latest versions. @sneridagh [#7298](https://github.com/plone/volto/pull/7298)
- Adjust peer dependencies and engine. @sneridagh

## 1.0.0-alpha.4 (2025-05-24)

### Feature

- Make Slate text block links RAC links with '@plone/components/tailwind' @ksuess [#7087](https://github.com/plone/volto/pull/7087)

### Bugfix

- Fix image block so it goes through the ++api++ routing. @sneridagh [#6773](https://github.com/plone/volto/pull/6773)
- Fix image URL generation. @sneridagh [#6865](https://github.com/plone/volto/pull/6865)
- Adapt the images and teaser URL to the new images middleware. @sneridagh [#6908](https://github.com/plone/volto/pull/6908)

### Internal

- Use ESlint 9, fix code. @sneridagh [#6775](https://github.com/plone/volto/pull/6775)
- Added vitest config to not fail if no test is present. @sneridagh [#6916](https://github.com/plone/volto/pull/6916)

## 1.0.0-alpha.3 (2025-02-08)

### Internal

- Update internal `peerDependencies` to include React 19.
  Update TS version. @sneridagh [#6641](https://github.com/plone/volto/pull/6641)
- Update internal `peerDependencies` to include React 19, now for real. @sneridagh [#6728](https://github.com/plone/volto/pull/6728)

## 1.0.0-alpha.2 (2025-01-24)

### Feature

- Added more blocks. @sneridagh [#6409](https://github.com/plone/volto/pull/6409)

### Bugfix

- Fixed several typing errors and a map without key. @sneridagh [#6599](https://github.com/plone/volto/pull/6599)

### Internal

- Centralize `tsconfig`. @sneridagh [#6536](https://github.com/plone/volto/pull/6536)

## 1.0.0-alpha.1 (2024-07-26)

### Internal

- Initial release @sneridagh [#0](https://github.com/plone/volto/pull/0)

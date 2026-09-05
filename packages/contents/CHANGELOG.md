# @plone/contents Release Notes

<!-- Do *NOT* add new change log entries to this file.
     You should create a file in the news directory instead.
     For helpful instructions, please see:
     https://6.docs.plone.org/contributing/index.html#contributing-change-log-label
-->

<!-- towncrier release notes start -->

## 1.0.0-alpha.0 (2026-09-05)

### Feature

- Added the `@plone/contents` package with Seven folder contents views, actions, upload, ordering, filtering, and pagination. @pnicolli @giuliaghisini 

### Internal

- Adapted routes to React Router v8's renamed loader/action context fields and `meta()` match shape. @sneridagh 
- Declared the catalog-managed i18next version as a peer dependency to keep react-i18next instances unified. @sneridagh 
- Updated contents route imports and TypeScript app type resolution to use the `@plone/aurora` app alias. @sneridagh

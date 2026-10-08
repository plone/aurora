# @plone/quanta Release Notes

<!-- You should *NOT* be adding new change log entries to this file.
     You should create a file in the news directory instead.
     For helpful instructions, please see:
     https://6.docs.plone.org/volto/developer-guidelines/contributing.html#create-a-pull-request
-->

<!-- towncrier release notes start -->

## 1.0.0-alpha.2 (2026-10-06)

### Bugfix

- Fixed the quanta table row drag handle relying on a global CSS reset to drop the basic button styles. @sneridagh [#199](https://github.com/plone/aurora/issues/199)

## 1.0.0-alpha.1 (2026-10-03)

### Feature

- Initial release of `@plone/quanta`, the Quanta design system components previously exported from `@plone/components/quanta`. @pnicolli 

### Documentation

- Updated `docs/how-to-guides/customize-login-screen.md` and `docs/tutorials/add-prisma-database.md` to import from `@plone/quanta`. @pnicolli

  Document that consumers need `@plone/icons/icons.css` and a Tailwind `@source` for `@plone/icons`. @pnicolli

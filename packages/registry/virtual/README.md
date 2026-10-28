# Virtual modules

Each file here backs an `@plone/registry/<name>` import whose real content is generated for each app.
In an app built with the Plone registry Vite plugin, the plugin aliases the import to the file it generated in the app's `.plone/` folder.
Everywhere else, such as the unit tests, the Storybook, or the type checks of a package, the import resolves to the file here through the `exports` of `package.json`.

Each file must:

- export a safe empty default, the value when no add-on contributes anything;
- have a `.d.ts` next to it that describes the generated module;
- be listed in the `exports` of `package.json` under its `@plone/registry/<name>` import.

| Import                                                           | File               |
| ---------------------------------------------------------------- | ------------------ |
| `@plone/registry/plate-editor`, `@plone/registry/plate-renderer` | `plate-plugins.js` |

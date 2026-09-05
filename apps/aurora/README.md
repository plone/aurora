# Plone Aurora

Plone Aurora is a fast, elegant, and intuitive React-based frontend for [Plone](https://plone.org) and [`plone.restapi`](https://github.com/plone/plone.restapi)-compatible backends.

It succeeds Plone Volto and combines React 19, [React Router 8](https://reactrouter.com/), and the modular `@plone/*` packages.

> [!WARNING]
> Plone Aurora is experimental and currently released as an alpha.
> It isn't ready for production use and has no formal support.
> Its public interfaces, behavior, and package structure may change without notice between alpha releases.

## Get started

The recommended way to start a Plone Aurora project is with [Cookieplone](https://github.com/plone/cookieplone), which creates a ready-to-use frontend add-on project with development and deployment tooling.

Follow the [Create a package](https://plone-aurora.readthedocs.io/get-started/create-package.html) guide to create and run your first project.

## Documentation

- [Plone Aurora documentation](https://plone-aurora.readthedocs.io/)
- [Online demo](https://aurora.demo.plone.org/)
- [Storybook](https://plone-storybook.readthedocs.io/?path=/docs/introduction--docs)
- [Source code](https://github.com/plone/aurora)
- [Issue tracker](https://github.com/plone/aurora/issues)

## Develop Plone Aurora core

For requirements and detailed instructions, see [Develop Plone Aurora core](https://plone-aurora.readthedocs.io/contributing/developing-core.html).

Clone the repository and install its dependencies:

```shell
git clone https://github.com/plone/aurora.git
cd aurora
make install
```

Start the backend in one terminal:

```shell
make backend-docker-start
```

Start the frontend in a second terminal:

```shell
pnpm start
```

The frontend is available at <http://localhost:3000> and the backend at <http://localhost:8080>.

## Releases

The Plone team publishes Aurora as a sequence of alpha releases during active development.
The npm package uses the `alpha` dist-tag.
Follow [Update Plone Aurora](https://plone-aurora.readthedocs.io/conceptual-guides/cookieplone-frontend-add-on.html#update-plone-aurora) to pin or update the Aurora version in a Cookieplone-generated project.

## License

The [MIT License](https://github.com/plone/aurora/blob/main/LICENSE.md) covers Plone Aurora.
The [Plone Foundation](https://plone.org/foundation/) holds the copyrights.

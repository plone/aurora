---
myst:
  html_meta:
    "description": "Plone Aurora uses Vitest for unit testing. Developers may use @testing-library/react for writing tests. For every feature or component, a unit test is mandatory in Plone Aurora core."
    "property=og:description": "Plone Aurora uses Vitest for unit testing. Developers may use @testing-library/react for writing tests. For every feature or component, a unit test is mandatory in Plone Aurora core."
    "property=og:title": "Testing Plone Aurora with Vitest"
    "keywords": "Plone Aurora, Plone, frontend, React, testing, Vitest"
---

# Testing

This chapter describes how to write and run unit tests in Plone Aurora.
It covers how to use {term}`Vitest`, the unit test tool for Plone Aurora core.

The popular {program}`@testing-library/react` is also available for writing your tests.
For every feature or component, a unit test is mandatory in Plone Aurora core.


(testing-vitest-configuration-label)=

## Vitest configuration

Plone Aurora is a monorepo made up of the {program}`apps/aurora` application and several packages under {file}`packages/*`, such as {program}`@plone/client`, {program}`@plone/components`, and {program}`@plone/blocks`.
Each package has its own {file}`vitest.config.ts` file, so tests are configured and run independently per package rather than through a single shared configuration.


(run-vitest-tests-on-aurora-core-label)=

## Run Vitest tests across the monorepo

You normally run tests from the root of the repository, across all packages, using the following command.

```shell
pnpm -r test
```

If you only want to run the tests for a specific package, use pnpm's `--filter` argument with the package name, as declared in its {file}`package.json`.
For example, to run the tests only for `@plone/cmsui`, run the following command from the root of the repository.

```shell
pnpm --filter @plone/cmsui test
```

```{note}
You can also `cd` into the package directory, for example {file}`apps/aurora` or {file}`packages/cmsui`, and run `pnpm test` directly from there.
```

Vitest tests must pass locally before you push commits to the remote Plone Aurora repository.
Vitest has several modes to run unit tests locally.
You can run Vitest in watch mode, run only failed tests, or run only specific tests.

By default, Vitest runs in watch mode when you execute the following command.
This makes it faster and easier to test code changes.

```shell
pnpm test
```

If you don't want to run tests in watch mode, you can use the following command.
This will execute all tests once without entering watch mode.

```shell
pnpm test -- --watch=false
```

or

```shell
CI=1 pnpm test
```

Then you can follow the Vitest prompts for keys that you can enter to trigger test execution.

```console
 › Press a to run all tests.
 › Press f to run only failed tests.
 › Press p to filter by a filename regex pattern.
 › Press t to filter by a test name regex pattern.
 › Press q to quit.
 › Press Enter to run all tests.
```

You can also run only specific tests, specifying the path containing the tests you want to run, using the following command as a typical example.

```shell
pnpm test src/components/theme/Image
```


(testing-plone-client-label)=

## Testing @plone/client

Unlike the other packages, the {program}`@plone/client` package requires a running Plone backend to run its tests, since its tests exercise real HTTP requests against a Plone site.

Before running the tests for {program}`@plone/client`, start the backend from the root of the repository.

```shell
make acceptance-backend-start
```

Once the backend is running, you can run the package's tests as described above, for example:

```shell
pnpm --filter @plone/client test
```


## Acceptance tests

```{seealso}
See the chapter {doc}`acceptance-tests`.
```

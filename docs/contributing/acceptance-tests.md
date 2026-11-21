---
myst:
  html_meta:
    "description": "Developer guidelines for acceptance tests."
    "property=og:description": "Developer guidelines for acceptance tests."
    "property=og:title": "Acceptance tests"
    "keywords": "Plone Aurora, Plone, frontend, React, helper command, acceptance, tests, Playwright, contributing"
---

# Acceptance tests

Plone Aurora uses [Playwright](https://playwright.dev/) for browser-based acceptance tests.

There are a number of tests available covering all the configuration use cases.
These tests have both a specific backend and frontend configuration setup and a related set of tests.
The continuous integration infrastructure runs them all automatically on every push to a branch or a pull request.

The tests can be run in headless mode (same as the CI does), or within the Playwright user interface.
The latter is the one that you run under development.


## How to run acceptance tests locally (during development)

When writing new acceptance tests, you usually want to minimize the time it takes to run the tests, while also being able to debug or inspect what's going on.

Being able to restart individual components also comes in handy.
It's recommended to start three individual terminal sessions, one each for running the Plone backend, the Plone Aurora frontend, and the acceptance tests.
All sessions should start from the repository root.

1.  In the first session, start the backend server.

    ```shell
    make acceptance-backend-start
    ```

1.  In the second session, start the frontend server.

    ```shell
    make acceptance-frontend-dev-start
    ```

1.  In the third session, start the Playwright tests runner.

    ```shell
    make acceptance-test
    ```

1.  In the main Playwright runner section, you will see all of the test specs that Plone Aurora developers have written to test Plone Aurora and its packages.

1.  To run a test, interact with the file based tree that displays all possible tests to run, and click on the test spec you need to run.

We provide the following major test specs:

-   Core (`core` used to test the core functionality of Plone Aurora)
-   Multilingual (`multilingual` tests the multilingual support of Plone Aurora)
-   Working Copy (`workingCopy` tests the working copy feature of Plone Aurora)
-   Test add-on (tests Plone Aurora with blocks and fields that are not present in vanilla Plone Aurora, see {ref}`acceptance-tests-test-addon-label`)

There are convenience commands for each of these specs.
See `Makefile` at the root of the repository for more information.


### Write new acceptance tests

Go to the folder `packages/*/acceptance/tests` to see existing tests.
You can create new test files using the `*.test.ts` naming convention.
All test files are automatically picked up by Playwright.

```{seealso}
-   [Playwright documentation](https://playwright.dev/docs/intro)
-   {doc}`visual-regression-tests`, to check the look of Plone Aurora with screenshots
```


(acceptance-tests-test-addon-label)=

### Test what the core doesn't ship

Some features need configuration that vanilla Plone Aurora doesn't have, such as a block whose settings use a widget no core block uses yet.
Register it in the test add-on, {file}`packages/test-addon`.
It's a private package, never published, and the app only loads it when the `PLONE_TEST_ADDON` environment variable is set when the app is built or started.
The `acceptance-frontend-dev-start` and `acceptance-frontend-prod-start` make targets set it, so the acceptance and visual regression tests in CI have it too.

For example, the `objectListTest` block has an `object_list` field in each layout.
It's restricted, so it doesn't show in the block chooser: the tests in {file}`packages/cmsui/acceptance/tests/object-list-widget.test.ts` create a page with the block in its data, and edit it in the block settings.

To run the app with the test add-on yourself:

```shell
PLONE_TEST_ADDON=1 PLONE_API_PATH=http://localhost:55001/plone pnpm --filter @plone/aurora start
```


## Helper commands

There are some helper commands in {file}`packages/tooling/playwright` written by Plone Aurora contributors and made available for the acceptance tests using Playwright.

Plone Aurora core makes heavy use of these helpers in the core tests to avoid verbose duplication, and they can make your life easier.

---
myst:
  html_meta:
    "description": "How visual regression tests work in Plone Aurora, how to review a failure, and how to update the baseline screenshots."
    "property=og:description": "How visual regression tests work in Plone Aurora, how to review a failure, and how to update the baseline screenshots."
    "property=og:title": "Visual regression tests"
    "keywords": "Plone Aurora, Plone, frontend, React, visual regression, screenshots, snapshots, Playwright, contributing"
---

(visual-regression-tests-label)=

# Visual regression tests

Visual regression tests take screenshots of Plone Aurora and compare them against approved baseline images.
They catch styling regressions that {doc}`acceptance-tests` can't see, such as a lost border, a broken layout, or a menu rendered in the wrong place.

They use the same [Playwright](https://playwright.dev/) setup as the acceptance tests, with their own configuration in {file}`playwright-visual.config.ts`.

```{note}
Visual regression tests don't run on pull requests.
They run nightly on the default branch, and on demand on any branch.
A styling change in your pull request doesn't block it, but you should check the visual regression tests before it's merged if you changed styles.
```


(visual-regression-tests-overview-label)=

## Overview

-   The tests live in {file}`packages/*/acceptance/visual/`.
    They reuse the fixtures of the acceptance tests, such as {file}`packages/plate/acceptance/fixtures/`, to create their test pages.
-   The baseline screenshots are stored in a separate public repository, [`plone/aurora-visual-regression`](https://github.com/plone/aurora-visual-regression).
    CI checks it out into {file}`playwright/__screenshots__/`, which is ignored by Git in the Plone Aurora repository.
-   Baselines are only ever generated in CI, on Linux, with the same browser build.
    Screenshots generated on your computer differ slightly in font rendering, so they must never be committed to the screenshots repository.
-   Two GitHub Actions workflows manage them.
    -   **Visual Regression Tests** compares the current code against the baselines.
        It runs nightly at 03:00 UTC on the default branch, and you can start it by hand on any branch.
    -   **Update VRT Screenshots**, where VRT stands for visual regression tests, regenerates the baselines and pushes them to the screenshots repository.
        You start it by hand, and a maintainer approves each run.

The current tests cover the native blocks of the Plone Aurora editor presets, in both the public view and the editor, and the editor overlays, such as the floating toolbar, menus, and popovers.
They cover the essentials only.
Behavior belongs in the acceptance tests.


(visual-regression-tests-run-locally-label)=

## Run visual regression tests locally

Running the tests locally is useful while you write or change them.

1.  Start the backend and the frontend, as described in {doc}`acceptance-tests`.

    ```shell
    make acceptance-backend-start
    ```

    ```shell
    make acceptance-frontend-dev-start
    ```

1.  Get the current baselines by cloning the screenshots repository into {file}`playwright/__screenshots__/`.

    ```shell
    git clone https://github.com/plone/aurora-visual-regression.git playwright/__screenshots__
    ```

    If the folder already exists, update it instead.

    ```shell
    git -C playwright/__screenshots__ pull
    ```

1.  Run the tests.

    ```shell
    pnpm visual-test
    ```

    To use the Playwright user interface instead, run the following command.

    ```shell
    pnpm visual-test:open
    ```

    If your frontend doesn't run on port 3000, set the `BASE_URL` environment variable.

    ```shell
    BASE_URL=http://localhost:3200 pnpm visual-test
    ```

Local runs tolerate a difference of up to 5% of the pixels of each screenshot, to absorb font rendering differences between operating systems.
CI runs don't tolerate any difference.
A local run that passes is therefore a good sign, but not a guarantee.

```{warning}
Don't run `pnpm visual-test --update-snapshots` and push the result to the screenshots repository.
Always update the baselines through the **Update VRT Screenshots** workflow, as described in {ref}`visual-regression-tests-update-label`.
```


(visual-regression-tests-review-failure-label)=

## Review a failed run

When a run of **Visual Regression Tests** fails, find out whether the change is a regression or intended.

1.  Open the failed run in the [Actions tab](https://github.com/plone/aurora/actions/workflows/visual-regression.yml) of the Plone Aurora repository.
1.  In the run summary, download the `visual-regression-results` artifact and extract it.
1.  For each failed screenshot, the artifact contains three images.

    -   {file}`*-expected.png` is the baseline.
    -   {file}`*-actual.png` is what the test rendered.
    -   {file}`*-diff.png` highlights the pixels that differ.

    The {file}`playwright-report/` folder of the artifact contains an HTML report that shows them side by side.
    Open it with the following command.

    ```shell
    pnpm exec playwright show-report path/to/playwright-report
    ```

1.  Decide what to do.

    -   If the change is a regression, fix the code.
        Don't update the baselines.
    -   If the change is intended, update the baselines, as described in the next section.


(visual-regression-tests-update-label)=

## Update the baseline screenshots

Update the baselines when an intended change modifies the look of a tested page or component, or when you add a new visual test.

```{important}
All branches share the same baselines, on the `main` branch of the screenshots repository.
If you update them from a feature branch, the nightly check on the default branch fails until your pull request is merged.
Update them from a feature branch right before merging, or from the default branch right after merging.
```

1.  Go to the **Update VRT Screenshots** workflow in the [Actions tab](https://github.com/plone/aurora/actions/workflows/update-visual-regression-screenshots.yml).
1.  Select {guilabel}`Run workflow`.
1.  Choose the branch with the intended changes.
    Use the default branch to accept changes that are already merged.
1.  Optionally, enter a pattern in {guilabel}`Only update tests whose title matches this pattern (empty for all)`, to update only some screenshots.
    The pattern is passed to Playwright's `--grep` option.
    For example, `Native blocks` only updates the native blocks pages.
    Leave it empty to update all screenshots.
1.  Select {guilabel}`Run workflow`.
1.  The job waits for approval in the `visual-regression` environment.
    Ask a maintainer to review and approve it.
    Maintainers approve it from the run page, with {guilabel}`Review deployments`.
1.  Once approved, the job regenerates the screenshots and pushes the changed ones to the screenshots repository.
    The run summary lists the updated files.
1.  Run **Visual Regression Tests** on the same branch to confirm that it passes.

You can also start the workflow from the command line with the [GitHub CLI](https://cli.github.com/).

```shell
gh workflow run update-visual-regression-screenshots.yml --repo plone/aurora --ref my-branch
```

To update only some screenshots, pass the pattern as an input.

```shell
gh workflow run update-visual-regression-screenshots.yml --repo plone/aurora --ref my-branch -f grep="Native blocks"
```

To check the result of your change on a branch before merging, start **Visual Regression Tests** on it.

```shell
gh workflow run visual-regression.yml --repo plone/aurora --ref my-branch
```


(visual-regression-tests-write-label)=

## Write new visual regression tests

Add visual tests in a {file}`visual` folder next to the package's acceptance tests, for example {file}`packages/plate/acceptance/visual/`, using the `*.test.ts` naming convention.
The visual regression configuration picks them up automatically, and the acceptance tests configuration ignores them.

Follow these guidelines.

-   Screenshot only what matters visually.
    Test behavior in the acceptance tests.
-   Only cover features that Plone Aurora actually uses, such as the blocks and tools available in its editor presets.
-   Create the test content programmatically, with the fixtures of the acceptance tests.
    The backend is reset around every test, so each test creates the small page it needs through the REST API.
    For example, `createNativeBlocksPage(page, ['table', 'lists'])` creates a page with only a table and lists.
-   Keep the content deterministic.
    Avoid dates, random values, and remote resources in anything you capture.
-   Prefer screenshots of a single element, such as a menu or a toolbar, over full-page screenshots.
    They're smaller, more stable, and point to the component that changed.
-   Wait for the page to settle before taking a screenshot, with the `settle` helper in {file}`packages/plate/acceptance/visual/helpers.ts`.
    It waits for pending requests and web fonts.
    Animations and the text caret are disabled by the configuration.

After adding a test, run **Update VRT Screenshots** on your branch to create its baseline.
Until then, the test fails with a missing snapshot.

```{seealso}
-   [Playwright visual comparisons](https://playwright.dev/docs/test-snapshots)
-   {doc}`visual-regression-tests-ci-setup`, for maintainers who set up or maintain the GitHub infrastructure
```

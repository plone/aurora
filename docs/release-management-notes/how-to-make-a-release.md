---
myst:
  html_meta:
    "description": "How to make a Plone Aurora release"
    "property=og:description": "How to make a Plone Aurora release"
    "property=og:title": "How to make a Plone Aurora release"
    "keywords": "Plone Aurora, Plone, frontend, release, release-it, towncrier, prereleaser, npm, GitHub"
---

(how-to-make-a-release)=

# How to make a Plone Aurora release

This page describes how maintainers release the Plone Aurora packages and the `@plone/aurora` application.

The release process uses the following tools.

-   [`release-it`](https://www.npmjs.com/package/release-it) bumps the version, commits, tags, pushes, and creates the GitHub release. A GitHub Actions workflow publishes the new versions to npm using trusted publishing.
-   [`towncrier`](https://towncrier.readthedocs.io/en/stable/) builds the change log of each package from its news fragments.
-   The `prereleaser` convenience script lists the packages that have pending changes, and releases them in the correct order.


## Requirements

To make a release, you must fulfill the following requirements.

-   Have permission to push to the `main` branch of the [`plone/aurora`](https://github.com/plone/aurora) repository.
-   Have permission to create release tags under the repository tag ruleset.
-   Ensure the package has an npm trusted publisher configured as described below.
-   Have the [GitHub CLI](https://cli.github.com/) (`gh`) installed and logged in with an account that can create releases in the [Plone Aurora releases page](https://github.com/plone/aurora/releases).
-   Have [`uv`](https://docs.astral.sh/uv/) installed.

To request these permissions, on GitHub tag `@plone/release-team`, or in Discord post to the [`release-team` channel](https://discord.com/channels/786421998426521600/897549410521714760).


### Permission to push to the `main` branch

The release process commits the version bump and the change log, tags the release, and pushes directly to the `main` branch.
The `main` branch is protected, so you need permission to push to it.


### Configure trusted publishing and tag protection

Before migrating releases, an npm package administrator must configure a [trusted publisher](https://docs.npmjs.com/trusted-publishers/) for each migrated package: owner `plone`, repository `aurora`, workflow filename `publish-npm.yml`, and environment `npm-release`.
Configure the GitHub environment `npm-release` and restrict its deployment refs and required reviewers to the release managers as appropriate.
Verify the configuration with a controlled release before disabling other publishing methods or revoking existing credentials.
The workflow uses npm OIDC and needs no npm token.

A repository administrator must also create an active [tag ruleset](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets) targeting **all tags**, with creation, update, and deletion restricted.
Grant bypass only to the release managers team and a dedicated team containing the explicitly approved users; keep those team memberships current.
Do not grant a broad administrator or repository role bypass.
Review organization-level rules and who can edit rulesets or team membership: administrators who can change these settings remain part of the trust boundary.
Verify both an authorized and an unauthorized account before relying on this restriction.
Protect `main`, workflow changes, and the environment as well; the workflow verifies that the tagged commit is reachable from `main`, but workflow code from a tag is itself part of the trust boundary.

The migrated packages are the packages listed in `packages/scripts/publish-packages.js`.
`@plone/scripts` retains its existing non-publishing release configuration.
Volto packages retain their separate release process.


### Log in with the GitHub CLI

`release-it` creates a GitHub release for each package release, and it needs a GitHub token to do so.
The `release` scripts of each package take this token from the GitHub CLI.
They run `release-it` as follows.

```shell
GITHUB_TOKEN=${GITHUB_TOKEN:-$(gh auth token)} release-it
```

Install the GitHub CLI, then log in once.

```shell
gh auth login
```

You can check your login with the following command.

```shell
gh auth status
```

You don't need to create a GitHub personal access token or export `GITHUB_TOKEN` in your shell.
If the variable `GITHUB_TOKEN` is set, the release scripts use it instead of the GitHub CLI token.

```{warning}
Don't export `GITHUB_TOKEN` in your shell profile.
The GitHub CLI and other tools that rely on it, such as AI assistant integrations, give priority to `GITHUB_TOKEN` over your `gh auth login` credentials.
If `gh auth status` shows `(GITHUB_TOKEN)` instead of `(keyring)`, find and remove the line that exports it in your shell startup files.
```


### Install `uv`

The release process calls `towncrier` through `uvx`, the command that comes with `uv`.
`uvx` runs Python applications without installing them in your system first, similar to `npx` for Node.js.

Install `uv` with the following command, or with any of the other methods described in the [`uv` installation documentation](https://docs.astral.sh/uv/getting-started/installation/).

```shell
curl -LsSf https://astral.sh/uv/install.sh | sh
```

Make sure `uvx` is on your `$PATH`.

```shell
uvx --version
```


## Before you start

Make sure your local `main` branch is up to date, and install the dependencies from the root of the repository.

```shell
git switch main
git pull
pnpm install
```


## Release with the `prereleaser` script

The `prereleaser` script is the recommended way to make a release.
Run it from the root of the repository.

It looks for the news fragments of each package, in other words, the changes that haven't been released yet.
It then prints a release plan with the packages that need a release, in the order in which they must be released.


### Check the release plan

To see the release plan without releasing anything, run the following command.

```shell
pnpm prereleaser
```

The following is sample output.

```console
Release plan
============

Core packages (level 1)
 1. @plone/client (packages/client) - 2 news fragments
 2. @plone/registry (packages/registry) - 1 news fragment

Add-on packages (level 3)
 3. @plone/plate (packages/plate) - 3 news fragments
 4. @plone/cmsui (packages/cmsui) - 1 news fragment

Application
 5. @plone/aurora (apps/aurora) - 1 news fragment
```

The packages are released in dependency order, so each package is released after the packages it depends on.

1.  `@plone/types`
2.  Core packages: `@plone/client`, `@plone/components`, and `@plone/registry`
3.  Utilities packages: `@plone/helpers` and `@plone/react-router`
4.  Add-on packages: `@plone/plate`, `@plone/blocks`, `@plone/layout`, `@plone/theming`, `@plone/agave`, `@plone/cmsui`, `@plone/publicui`, and `@plone/contents`
5.  The application: `@plone/aurora`

This order is defined in `RELEASE_GROUPS` in {file}`packages/scripts/preleaser.js`.
If you add a new releasable package, add it to the right group in that list.


### Run the releases

To release the packages in the plan, run the following command.

```shell
pnpm prereleaser --release
```

The script asks you for each package in the plan, one at a time.

```console
Release @plone/client? [Y/n/q]
```

-   Press {kbd}`Enter` or {kbd}`Y` to release the package.
-   Press {kbd}`n` to skip the package and continue with the next one.
-   Press {kbd}`q` to stop the release sequence.

For each package that you release, the script runs `pnpm --filter <package> release`.
This starts `release-it` for that package, which does the following steps, asking for confirmation along the way.

1.  Asks you for the new version number.
2.  Builds the change log of the package with `towncrier`, and removes the released news fragments.
3.  Builds the package locally, for packages whose release hooks require it.
4.  Commits the changes, and tags the release.
5.  Pushes the commit and the tag to the `main` branch.
6.  Creates the GitHub release, with the change log of this version as release notes.
7.  Starts the `Publish npm packages` workflow when the tag is pushed.

You don't need to wait for npm between packages.
Each workflow run checks out the tagged commit, builds the workspace dependencies, and runs `packages/scripts/publish-packages.js`.
The script runs `pnpm publish --recursive` on the migrated packages, which does the following.

-   Skips every package whose version is already on npm, so a run publishes whatever is new at that commit, including packages from earlier tags.
-   Publishes in dependency order, and waits until each published version is available on npm before it publishes the packages that depend on it.
-   Replaces the `workspace:` and `catalog:` dependency specifiers with the exact versions, as `pnpm pack` does.

Runs never overlap.
If several tags arrive while a run is in progress, GitHub keeps only the newest pending run; it publishes the versions of the earlier tags as well.

Stable versions use the `latest` distribution tag. Prereleases use their prerelease identifier, except `@plone/aurora` and `@plone/client`, which retain their existing behavior of promoting prereleases to `latest`.
The script writes the distribution tag of each package to a top-level `tag` field of its manifest during the run, because pnpm uses that field instead of the `--tag` option.

The GitHub release can exist before the npm workflow finishes.
Check the last workflow run after the release sequence.
If publishing fails, correct the configuration or underlying issue and rerun the failed workflow from GitHub Actions; it continues with the versions that are not on npm yet.
Do not move or recreate a release tag to retry. An npm version cannot be republished after it succeeds.

If a release fails, the script stops.
Fix the problem, then run `pnpm prereleaser --release` again.
The packages that were already released no longer have news fragments, so they don't appear in the plan.


### Packages outside the release plan

The `prereleaser` script also lists the packages that have news fragments, but aren't part of the release plan, under {guilabel}`Changed packages outside the planned release chain`.
The script doesn't release these packages.
Release them manually, as described in the next section.


## Release a single package manually

You can release any package without the `prereleaser` script.
Run the following commands from the root of the repository.

To release a package, use the `release` script.

```shell
pnpm --filter <package> release
```

To preview a release without actually making one, use the `dry-release` script.

```shell
pnpm --filter <package> dry-release
```

To release an alpha version, use the `release-alpha` script.

```shell
pnpm --filter <package> release-alpha
```

To release an alpha version of the next major version, use the `release-major-alpha` script.

```shell
pnpm --filter <package> release-major-alpha
```

```{note}
The `@plone/aurora` application only has the `release` and `release-alpha` scripts.
```

For example, to make a dry run of the release of `@plone/client`, use the following command.

```shell
pnpm --filter @plone/client dry-release
```


## Release the container image

The image is maintained in the separate [container-aurora repository](https://github.com/plone/container-aurora). Its `make commit-and-release` commits the changed `version.txt`, pushes the commit, and creates and pushes `v<version>`. The tag triggers its image workflow, which builds four images for two architectures and publishes version tags and `latest`. A push to `main` alone publishes SHA tags; dispatching the current workflow on `main` does not make a versioned release.

After `@plone/aurora` is available on npm, update `version.txt` in container-aurora, review and commit any intended image changes, and run the repository's release procedure with an authorized account. Verify the tag workflow and resulting image tags. Its current workflow promotes tagged prereleases to `latest`, so release managers must account for that behavior.

Automating this handoff requires a separately reviewed change in container-aurora: accept an authenticated release request, validate the npm version, update `version.txt` through its protected branch process, and create the matching protected tag using a narrowly scoped GitHub App. The current repository token cannot write to another repository, and a workflow dispatch alone neither updates the version nor creates a release tag. Keep the manual handoff until that integration and its authorization rules are in place.

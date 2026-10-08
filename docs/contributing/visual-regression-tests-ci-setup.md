---
myst:
  html_meta:
    "description": "How to set up and maintain the GitHub infrastructure of the Plone Aurora visual regression tests: screenshots repository, deploy key, ruleset, and protected environment."
    "property=og:description": "How to set up and maintain the GitHub infrastructure of the Plone Aurora visual regression tests: screenshots repository, deploy key, ruleset, and protected environment."
    "property=og:title": "Set up the visual regression tests infrastructure"
    "keywords": "Plone Aurora, Plone, visual regression, screenshots, GitHub Actions, deploy key, environment, ruleset, CI"
---

(visual-regression-tests-ci-setup-label)=

# Set up the visual regression tests infrastructure

This page is for maintainers of the Plone GitHub organization.
It explains how to set up the GitHub infrastructure that the {doc}`visual-regression-tests` need, and how to maintain it.
You only need to do it once.

To follow it, you need the following permissions.

-   Permission to create repositories in the [Plone GitHub organization](https://github.com/plone).
-   The **Admin** role on the [`plone/aurora`](https://github.com/plone/aurora) repository, to manage its environments and secrets.


(visual-regression-tests-ci-setup-overview-label)=

## Overview

The setup has the following pieces.

`plone/aurora-visual-regression`
:   A public repository that stores the baseline screenshots on its `main` branch.
    It's public, so that the comparison workflow can read it without credentials.
    It only contains screenshots of an open source user interface, so there's nothing sensitive in it.

A deploy key
:   An SSH key with write access to `plone/aurora-visual-regression` only.
    The update workflow uses it to push new baselines.
    Unlike a personal access token, it isn't tied to a person, doesn't expire when someone leaves, and can't access any other repository.

A ruleset on `plone/aurora-visual-regression`
:   Protects its `main` branch from force pushes and deletion.
    People must go through pull requests, and only the deploy key can push directly.

The `visual-regression` environment in `plone/aurora`
:   Holds the private deploy key as the `VRT_DEPLOY_KEY` secret.
    Its required reviewers must approve every run of the update workflow before the job gets the key.

The workflows in {file}`.github/workflows/` use these pieces as follows.

{file}`visual-regression.yml` (**Visual Regression Tests**)
:   Compares the code against the baselines.
    It runs nightly at 03:00 UTC on the default branch, and on demand on any branch.
    It checks out the screenshots repository without credentials, and its token only has `contents: read` permission.

{file}`update-visual-regression-screenshots.yml` (**Update VRT Screenshots**)
:   Regenerates the baselines and pushes them to the screenshots repository.
    It only runs on demand.
    Starting a workflow by hand requires write access to `plone/aurora`.
    The job runs in the `visual-regression` environment, so it waits for approval before it can use `VRT_DEPLOY_KEY`.
    Its own token only has `contents: read` permission, and only one update runs at a time.

Neither workflow runs on pull requests.
This matters for security, because the update job runs the test code of the branch it's started on while it holds a key with write access.
The environment approval is the safeguard: reviewers should only approve runs on branches whose code they trust.


(visual-regression-tests-ci-setup-repository-label)=

## Create the screenshots repository

Create a public repository named `aurora-visual-regression` in the Plone organization.
Initialize it with a README file, so that it has a `main` branch, because the workflows fail to check out an empty repository.
Use either the GitHub web interface or the GitHub CLI.

`````{tab-set}

````{tab-item} GitHub web interface
1.  Open [New repository](https://github.com/organizations/plone/repositories/new) for the Plone organization.
1.  In {guilabel}`Repository name`, enter `aurora-visual-regression`.
1.  In {guilabel}`Description`, enter `Baseline screenshots of the Plone Aurora visual regression tests`.
1.  Select {guilabel}`Public`.
1.  Select {guilabel}`Add README`.
1.  Select {guilabel}`Create repository`.
````

````{tab-item} GitHub CLI
Run the following command.

```shell
gh repo create plone/aurora-visual-regression --public --add-readme \
  --description "Baseline screenshots of the Plone Aurora visual regression tests"
```
````

`````

Then finish the setup of the repository in the GitHub web interface.

1.  Optionally, explain in the README that the repository is managed by the **Update VRT Screenshots** workflow of `plone/aurora`, and that screenshots must not be added by hand.
1.  In the repository {guilabel}`Settings`, under {guilabel}`General`, disable the features that it doesn't need, such as {guilabel}`Wikis`, {guilabel}`Issues`, and {guilabel}`Projects`.


(visual-regression-tests-ci-setup-deploy-key-label)=

## Create the deploy key

On your computer, in a temporary folder outside of any repository, generate a new SSH key pair without a passphrase.
GitHub Actions can't enter a passphrase.

```shell
ssh-keygen -t ed25519 -N "" -C "plone/aurora VRT screenshots" -f vrt_deploy_key
```

This creates two files.

-   {file}`vrt_deploy_key` is the private key.
    It goes into the `VRT_DEPLOY_KEY` secret.
-   {file}`vrt_deploy_key.pub` is the public key.
    It goes into the deploy keys of the screenshots repository.

Add the public key to the screenshots repository, with write access.
Use either the GitHub web interface or the GitHub CLI.

`````{tab-set}

````{tab-item} GitHub web interface
1.  Open {guilabel}`Settings` → {guilabel}`Deploy keys` of `plone/aurora-visual-regression`, and select {guilabel}`Add deploy key`.
1.  In {guilabel}`Title`, enter `plone/aurora Update VRT Screenshots workflow`.
1.  In {guilabel}`Key`, paste the content of {file}`vrt_deploy_key.pub`.
1.  Select {guilabel}`Allow write access`.
1.  Select {guilabel}`Add key`.
````

````{tab-item} GitHub CLI
Run the following command.

```shell
gh repo deploy-key add vrt_deploy_key.pub --repo plone/aurora-visual-regression \
  --allow-write --title "plone/aurora Update VRT Screenshots workflow"
```
````

`````

Keep the private key until you have stored it in the environment secret, as described in {ref}`visual-regression-tests-ci-setup-environment-label`.
Then delete both files.


(visual-regression-tests-ci-setup-ruleset-label)=

## Protect the screenshots repository

Create a ruleset, so that only the deploy key can push directly to `main`.

1.  Open {guilabel}`Settings` → {guilabel}`Rules` → {guilabel}`Rulesets` of `plone/aurora-visual-regression`.
1.  Select {guilabel}`New ruleset` → {guilabel}`New branch ruleset`.
1.  In {guilabel}`Ruleset Name`, enter `Protect main`.
1.  Set {guilabel}`Enforcement status` to {guilabel}`Active`.
1.  Under {guilabel}`Bypass list`, select {guilabel}`Add bypass`, and select {guilabel}`Deploy keys`.
    Also add the {guilabel}`Repository admin` role, so that administrators can fix things by hand if needed.
1.  Under {guilabel}`Targets`, select {guilabel}`Add target` → {guilabel}`Include default branch`.
1.  Under {guilabel}`Rules`, select the following rules.

    -   {guilabel}`Restrict deletions`
    -   {guilabel}`Block force pushes`
    -   {guilabel}`Require a pull request before merging`, with at least one required approval.

1.  Select {guilabel}`Create`.

With this ruleset, the update workflow can push new baselines, while people have to open pull requests, for example to remove screenshots of deleted tests.


(visual-regression-tests-ci-setup-environment-label)=

## Create the protected environment

Create the environment and its protection rules in the GitHub web interface.
The GitHub CLI has no command for them.

1.  Open {guilabel}`Settings` → {guilabel}`Environments` of `plone/aurora`, and select {guilabel}`New environment`.
1.  In {guilabel}`Name`, enter `visual-regression`, exactly, and select {guilabel}`Configure environment`.
    The update workflow refers to it by this name.
1.  Under {guilabel}`Deployment protection rules`, select {guilabel}`Required reviewers`.
    Add the people or teams that may approve updates of the baselines, such as the Plone Aurora maintainers team.
    You can add up to six people or teams.
    Any one of them can approve a run.
1.  Optionally, select {guilabel}`Prevent self-review`, so that the person who starts a run can't approve it.
    This is safer, but slower, because it always takes two people.
1.  Under {guilabel}`Deployment branches and tags`, keep {guilabel}`No restriction`.
    Baselines are updated both from the default branch and from feature branches.
    The required reviewers are the safeguard.
1.  Select {guilabel}`Save protection rules`.

Then store the private key as the `VRT_DEPLOY_KEY` secret of the environment.
Use either the GitHub web interface or the GitHub CLI.

`````{tab-set}

````{tab-item} GitHub web interface
1.  On the page of the `visual-regression` environment, under {guilabel}`Environment secrets`, select {guilabel}`Add environment secret`.
1.  In {guilabel}`Name`, enter `VRT_DEPLOY_KEY`, exactly.
1.  In {guilabel}`Value`, paste the whole content of the private key file {file}`vrt_deploy_key`, including the `-----BEGIN OPENSSH PRIVATE KEY-----` and `-----END OPENSSH PRIVATE KEY-----` lines.
1.  Select {guilabel}`Add secret`.
````

````{tab-item} GitHub CLI
Run the following command.

```shell
gh secret set VRT_DEPLOY_KEY --repo plone/aurora --env visual-regression < vrt_deploy_key
```
````

`````

```{important}
Store the key as an **environment** secret, not as a repository secret.
Repository secrets are available to every workflow of the repository, while environment secrets are only available to jobs that run in the environment, after its reviewers approve them.
```

Finally, delete the key files from your computer.

```shell
rm vrt_deploy_key vrt_deploy_key.pub
```


(visual-regression-tests-ci-setup-first-run-label)=

## Create the first baselines

After the workflows are on the default branch, create the first set of baselines.

1.  Start **Update VRT Screenshots** on the default branch.
    Use either the GitHub web interface or the GitHub CLI.

    `````{tab-set}

    ````{tab-item} GitHub web interface
    Open [Update VRT Screenshots](https://github.com/plone/aurora/actions/workflows/update-visual-regression-screenshots.yml) in the Actions tab, select {guilabel}`Run workflow`, keep the default branch and an empty pattern, and select {guilabel}`Run workflow`.
    ````

    ````{tab-item} GitHub CLI
    Run the following command.

    ```shell
    gh workflow run update-visual-regression-screenshots.yml --repo plone/aurora --ref main
    ```
    ````

    `````

1.  Approve the run, from its page in the Actions tab, with {guilabel}`Review deployments` → {guilabel}`Approve and deploy`.
1.  When it finishes, check that the screenshots repository has a new commit with the screenshots, in folders named after the test files, such as {file}`packages/plate/acceptance/visual/native-blocks.test.ts/`.
1.  Start **Visual Regression Tests** on the default branch, and check that it passes.
    Use either the GitHub web interface or the GitHub CLI.

    `````{tab-set}

    ````{tab-item} GitHub web interface
    Open [Visual Regression Tests](https://github.com/plone/aurora/actions/workflows/visual-regression.yml) in the Actions tab, select {guilabel}`Run workflow`, keep the default branch, and select {guilabel}`Run workflow`.
    ````

    ````{tab-item} GitHub CLI
    Run the following command.

    ```shell
    gh workflow run visual-regression.yml --repo plone/aurora --ref main
    ```
    ````

    `````

Until the first baselines exist, **Visual Regression Tests** fails, because Playwright reports every screenshot as missing.


(visual-regression-tests-ci-setup-notifications-label)=

## Get notified of nightly failures

When a scheduled run fails, GitHub only notifies the person who last changed the `cron` schedule of the workflow.
Watching the repository doesn't include workflow runs.

To make sure that failures don't go unnoticed, check the [workflow runs](https://github.com/plone/aurora/actions/workflows/visual-regression.yml), for example before each release.
If the team needs active notifications, the workflow can be extended to open or update an issue when the nightly run fails.


(visual-regression-tests-ci-setup-rotate-label)=

## Rotate the deploy key

Replace the deploy key at least once a year, and whenever someone who had access to it leaves the team or you suspect it leaked.

1.  Generate a new key pair, as described in {ref}`visual-regression-tests-ci-setup-deploy-key-label`, and add its public key to the screenshots repository.
1.  Replace the value of the `VRT_DEPLOY_KEY` environment secret with the new private key.
1.  Run **Update VRT Screenshots** once, to check that the new key works.
1.  Delete the old key from {guilabel}`Settings` → {guilabel}`Deploy keys` of the screenshots repository.
1.  Delete the new key files from your computer.


(visual-regression-tests-ci-setup-troubleshooting-label)=

## Troubleshooting

The update job stays in the "Waiting" state
:   It waits for approval in the `visual-regression` environment.
    A required reviewer must approve it with {guilabel}`Review deployments`.

`Permission denied (publickey)` when checking out or pushing the screenshots repository
:   The `VRT_DEPLOY_KEY` secret doesn't match the deploy key of the screenshots repository, or it's incomplete.
    Check that the secret is an environment secret of `visual-regression`, and that it contains the whole private key.

`ERROR: The key you are authenticating with has been marked as read only`
:   The deploy key was added without {guilabel}`Allow write access`.
    Delete it and add it again with write access.

Push rejected with `GH013: Repository rule violations found`
:   The ruleset doesn't allow the deploy key to bypass it.
    Add {guilabel}`Deploy keys` to its bypass list.

`fatal: couldn't find remote ref main` when checking out the screenshots repository
:   The screenshots repository is empty.
    Add a first commit, such as a README file, on `main`.

Every screenshot fails with "A snapshot doesn't exist"
:   The baselines haven't been created yet.
    Follow {ref}`visual-regression-tests-ci-setup-first-run-label`.

Screenshots differ although nothing changed
:   A change in the environment, such as a new version of Chromium or of the fonts in the runner image, can change the rendering.
    Review the diff images.
    If the differences are only rendering details, update the baselines from the default branch.

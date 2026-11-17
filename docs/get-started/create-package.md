---
myst:
  html_meta:
    "description": "How to create a package with only a frontend add-on using Cookieplone"
    "property=og:description": "How to create a package with only a frontend add-on using Cookieplone"
    "property=og:title": "How to create a package with only a frontend add-on using Cookieplone"
    "keywords": "Plone, Plone 6, Plone Aurora, create, add-on, package, frontend, Docker, Cookieplone"
---

(create-package-label)=

# Create a package: frontend add-on only

This chapter describes how you can create a package with only a frontend add-on using {term}`Cookieplone`.
Cookieplone is the recommended way to create a package as an add-on for Plone that uses the Plone Aurora frontend.
It also includes tools for development and deployment.


## What is an add-on package?

A frontend add-on is a self-contained, publishable package that extends or customizes the Plone Aurora frontend.
It contains only frontend code, such as configuration, React components, blocks, views, translations, and styles, and it ships no Python backend code of its own.

An add-on plugs into the Plone Aurora add-on registry.
Its `index.ts` exports a `loadConfig` function that receives the running configuration and returns it, letting you extend or override Plone Aurora's defaults without forking the core.
Because it is a standalone package, you can publish it to npm and reuse it across many Plone sites and projects.

To develop and test the add-on, this template still needs a running Plone site.
It provides one by starting a **vanilla Plone backend in a Docker container**, so you don't need a local Python backend checkout.
See {ref}`why-vanilla-backend-label` for the reasons and the limitations.

For the anatomy of the generated files and folders, see {doc}`../conceptual-guides/cookieplone-frontend-add-on`.


## Add-on package versus full project

Choose the template that matches what you need to build.

| | Add-on package (this chapter) | Full project ({doc}`create-project`) |
| --- | --- | --- |
| Generator | `uvx cookieplone aurora_addon` | `uvx cookieplone aurora_cmfplone` |
| Contents | A single frontend add-on package | A monorepo with `backend/`, `frontend/`, and `devops/` |
| Backend | Vanilla Plone, run from a Docker image | Your own Python CMFPlone backend that you can extend |
| Backend customization | Not possible in this package | Full: content types, behaviors, workflows, REST API services |
| Deployment tooling | Focused on publishing the frontend package (npm) | Docker, Ansible, caching, and CI for deploying the whole stack |
| Best for | Reusable frontend-only functionality shared across sites | Building and deploying a complete, bespoke Plone site |

In short, create an **add-on package** when you want to build frontend functionality that is reusable and distributable, and that does not require changes to the backend.
Create a **full project** when you need to customize the backend, or when you are building and deploying a complete site rather than a reusable package.

```{seealso}
{doc}`create-project` describes how to generate a complete project with both a Plone Aurora frontend and a Python CMFPlone backend.
```


(plone-aurora-create-project-cookieplone-generate-the-package-label)=

## Generate the add-on package

After satisfying the {doc}`system-requirements` and having {ref}`activated an LTS version of Node.js <plone-aurora-prerequisites-nodejs-label>`, generate the add-on package.

```{include} ../_inc/_cookieplone-version-note.md
```

```shell
uvx cookieplone aurora_addon
```

Cookieplone first runs a sanity check of your system, verifying that {term}`uv`, {term}`Node.js`, and {term}`Git` are available.


### Answer the prompts

Cookieplone then asks a series of questions to configure your add-on.
Each question offers a sensible default that you can accept by pressing {kbd}`Enter`.

| Prompt | Description | Example |
| --- | --- | --- |
| `Add-on Title` | Human-readable name for the add-on. | `Plone Aurora Add-on` |
| `Frontend Add-on Name` | Short slug used as the NPM package name and output folder. | `plone-aurora-add-on` |
| `Project Slug` | URL-friendly identifier used as the repository name. | `plone-aurora-add-on` |
| `Description` | Short summary of the add-on, used in package metadata and the `README`. | `A new add-on for Plone Aurora.` |
| `Author` | Name of the add-on author or organization. | `Plone Community` |
| `Author E-mail` | Contact email for the add-on author. | `collective@plone.org` |
| `GitHub Username or Organization` | Organization or username used to build the repository URL. | `collective` |
| `NPM Package Name` | Name of the package as published on npm. | `plone-aurora-add-on` |
| `Aurora Version` | Aurora frontend version to use, resolved to the latest version published on npm. | `1.0.0-alpha.7` |


### Skip the prompts

You can use the [`--no-input`](https://cookiecutter.readthedocs.io/en/latest/cli_options.html#cmdoption-cookiecutter-no-input) option to make Cookieplone skip the prompts and use the default values only.

```shell
uvx cookieplone aurora_addon --no-input
```


## Install the add-on package

Cookieplone creates a folder with the name of the add-on, in this example, {file}`plone-aurora-add-on`.

Change your current working directory to {file}`plone-aurora-add-on`.

```shell
cd plone-aurora-add-on
```

To install the add-on, use the following command.

```shell
make install
```

This will take a few minutes.
☕️
When the process completes successfully, it will exit with no message.


## Start Plone

Plone has two servers: one for the frontend, and one for the backend.
As such, we need to maintain two active shell sessions, one for each server, to start your Plone site.


### Start Plone backend

In the currently open session, issue the following command.

```shell
make backend-docker-start
```

Unlike the {doc}`full project <create-project>`, which starts a Python backend that you install and run locally, an add-on package starts the backend from a prebuilt Docker image.
This command pulls the official Plone backend image and runs it, so you don't need a local Python environment or a backend checkout to develop your add-on.

The Plone backend server starts up and emits messages to the console.

```console
2024-09-25 16:47:15,699 INFO    [chameleon.config:39][MainThread] directory cache: /<path-to-project>/backend/instance/var/cache.
2024-09-25 16:47:16,387 WARNING [ZODB.FileStorage:412][MainThread] Ignoring index for /<path-to-project>/backend/instance/var/filestorage/Data.fs
2024-09-25 16:47:16,508 INFO    [plone.restapi.patches:16][MainThread] PATCH: Disabled ZPublisher.HTTPRequest.ZopeFieldStorage.VALUE_LIMIT. This enables file uploads larger than 1MB.
2024-09-25 16:47:17,018 INFO    [plone.volto:23][MainThread] Aliasing collective.folderish classes to plone.volto classes.
2024-09-25 16:47:17,760 INFO    [Zope:42][MainThread] Ready to handle requests
Starting server in PID 20912.
2024-09-25 16:47:17,772 INFO    [waitress:486][MainThread] Serving on http://[::1]:8080
2024-09-25 16:47:17,772 INFO    [waitress:486][MainThread] Serving on http://127.0.0.1:8080
```

This will start a clean Plone server for development purposes so you can start developing your add-on.


(why-vanilla-backend-label)=

#### Why only a vanilla Plone backend?

The Docker image runs a **vanilla** (stock, unmodified) Plone backend, and this template cannot run a customized one.

An add-on package contains only frontend code.
It ships no Python backend package, so there is no backend source to install, no custom content types, behaviors, or REST API services to add, and therefore nothing from which to build a customized backend image.
The prebuilt image is used as-is to provide a standard Plone REST API for your frontend to develop against.

This is a deliberate trade-off.
Running a stock backend from a container keeps the add-on lightweight and lets you focus on frontend development without maintaining a Python environment.
The cost is that you cannot modify the backend from within an add-on package.

If your work requires backend changes, such as custom content types, behaviors, workflows, or REST API endpoints, create a {doc}`full project <create-project>` instead.
A full project generates a Python CMFPlone backend that you own and can extend, alongside the Aurora frontend.


### Start Plone frontend

Create a second shell session in a new window.
Change your current working directory to {file}`plone-aurora-add-on`.
Start the Plone frontend with the following command.

```shell
make start
```

The Plone frontend server starts up and emits messages to the console, and should end with the following.
```console
  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

Open a browser at the following URL to visit your Plone site.

http://localhost:3000

Your newly created add-on will be installed with vanilla Plone Aurora.
You can start developing it in the add-on package located in {file}`packages/plone-aurora-add-on`.

You can stop the site with {kbd}`ctrl-c`.

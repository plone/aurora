---
myst:
  html_meta:
    "description": "How to create a full Plone project with an Plone Aurora frontend and a Plone backend using Cookieplone"
    "property=og:description": "How to create a full Plone project with an Plone Aurora frontend and a Plone backend using Cookieplone"
    "property=og:title": "How to create a full Plone project with an Plone Aurora frontend and a Plone backend using Cookieplone"
    "keywords": "Plone, Plone 6, Plone Aurora, create, project, backend, monorepo, install, Cookieplone"
---

(create-project-label)=

# Create a project: Plone Aurora frontend and Plone backend

This chapter describes how you can create a complete Plone project using {term}`Cookieplone`.
Unlike {doc}`create a package with only a frontend add-on <create-package>`, this template generates a monorepo that contains both a Plone Aurora frontend and a Python CMFPlone backend, together with development, testing, and deployment tooling.

Cookieplone is the recommended way to create a full Plone project.


## What is a project?

A project is a complete, deployable Plone site that you own end to end.
Cookieplone generates it as a monorepo with three top-level areas.

`backend/`
: A Python CMFPlone backend add-on that you own and can extend with custom content types, behaviors, workflows, and REST API services.

`frontend/`
: A Plone Aurora frontend add-on, where you customize and extend the user interface.

`devops/`
: Deployment tooling, including Docker, Ansible, caching, and continuous integration, to build and ship the whole stack.

Unlike a {doc}`frontend add-on package <create-package>`, a project is not primarily meant to be published and reused elsewhere.
It is the codebase for one specific site, so it bundles everything needed to develop, test, and deploy that site.
Crucially, because it generates its own backend source, you run and modify a real Python backend locally instead of a prebuilt, vanilla Plone Docker image.


## Project versus add-on package

Choose the template that matches what you need to build.

| | Full project (this chapter) | Add-on package ({doc}`create-package`) |
| --- | --- | --- |
| Generator | `uvx cookieplone aurora_cmfplone` | `uvx cookieplone aurora_addon` |
| Contents | A monorepo with `backend/`, `frontend/`, and `devops/` | A single frontend add-on package |
| Backend | Your own Python CMFPlone backend that you run and can extend | Vanilla Plone, run from a Docker image |
| Backend customization | Full: content types, behaviors, workflows, REST API services | Not possible in the package |
| Deployment tooling | Docker, Ansible, caching, and CI for deploying the whole stack | Focused on publishing the frontend package (npm) |
| Best for | Building and deploying a complete, bespoke Plone site | Reusable frontend-only functionality shared across sites |

In short, create a **full project** when you need to customize the backend, or when you are building and deploying a complete site rather than a reusable package.
Create an **add-on package** when you want to build frontend functionality that is reusable and distributable, and that does not require changes to the backend.

```{seealso}
{doc}`create-package` describes how to generate a reusable, frontend-only add-on that develops against a vanilla Plone backend.
```


(plone-aurora-create-project-cookieplone-generate-the-project-label)=

## Generate the project

After satisfying the {doc}`system-requirements` and having {ref}`activated an LTS version of Node.js <plone-aurora-prerequisites-nodejs-label>`, generate the project.

```{include} ../_inc/_cookieplone-version-note.md
```

```shell
uvx cookieplone aurora_cmfplone
```

Cookieplone first runs a sanity check of your system, verifying that {term}`uv`, {term}`Node.js`, and {term}`Git` are available.
Docker is checked as an optional dependency, and is only needed if you want to run the local container stack.


### Answer the prompts

Cookieplone then asks a series of questions to configure your project.
Each question offers a sensible default that you can accept by pressing {kbd}`Enter`.

| Prompt | Description | Example |
| --- | --- | --- |
| `Project Title` | Human-readable name for the project, used in the `README` and documentation. | `Project Title` |
| `Project Description` | Short summary of the project, used in package metadata and the `README`. | `A new Plone project using Aurora with a Python CMFPlone backend.` |
| `Project Slug` | URL-friendly identifier used as the repository name and output folder. | `project-title` |
| `Project URL (without protocol)` | Hostname where the project will be deployed. | `project-title.example.com` |
| `Author` | Name of the project author or organization. | `Plone Foundation` |
| `Author E-mail` | Contact email for the project author. | `collective@plone.org` |
| `Should we use prerelease versions?` | Whether to include alpha, beta, and release candidate versions when resolving Plone. | `No` |
| `Plone Version` | Plone backend version to use, resolved to the latest available release. | `6.1.4` |
| `Aurora Version` | Aurora frontend version to use, resolved to the latest version published on npm. | `1.0.0-alpha.7` |
| `Frontend Container Base Version` | Version of the Plone frontend container base used to build Aurora. | `19.0.0` |
| `Python Package Name` | Dotted Python package name for the backend add-on. | `project.title` |
| `Aurora Add-on Name` | Name of the Aurora frontend add-on package. | `aurora-project-title` |
| `Language` | Default language for the Plone site. | `English` |
| `GitHub or GitLab username or organization slug` | Organization or username used to build the repository URL and container image paths. | `collective` |
| `Container Registry` | Container registry where Docker images will be published. | `GitHub Container Registry` |
| `Which persistent storage to use in the deployment stack?` | Backend storage strategy for the ZODB database. | `RelStorage with PostgreSQL` |
| `Should we setup a caching server?` | Include a Varnish caching layer in front of the backend. | `Yes` |
| `Add Ansible playbooks?` | Include Ansible playbooks for server provisioning and deployment. | `Yes` |
| `Add GitHub Action to Deploy this project?` | Include a GitHub Actions workflow for automated deployment. | `Yes` |
| `Would you like to add a documentation scaffold to your project?` | Generate a Sphinx-based documentation structure. | `Yes` |


### Skip the prompts

You can use the [`--no-input`](https://cookiecutter.readthedocs.io/en/latest/cli_options.html#cmdoption-cookiecutter-no-input) option to make Cookieplone skip the prompts and use the default values only.

```shell
uvx cookieplone aurora_cmfplone --no-input
```


## Install the project

Cookieplone creates a folder with the name of the project slug, in this example, {file}`project-title`.

Change your current working directory to {file}`project-title`.

```shell
cd project-title
```

To install both the backend and the frontend, use the following command.

```shell
make install
```

This installs the Plone backend into a virtual environment, creates a fresh Plone site with default content, and installs the Aurora frontend dependencies.
This will take a few minutes.

The generated project is a monorepo with three top-level areas.

```console
project-title/
├── backend/    # Python CMFPlone backend add-on
├── frontend/   # Plone Aurora frontend add-on
└── devops/     # Deployment tooling (Docker, Ansible, CI)
```


## Start Plone

Plone has two servers: one for the frontend, and one for the backend.
As such, we need to maintain two active shell sessions, one for each server, to start your Plone site.


### Start Plone backend

In the currently open session, issue the following command.

```shell
make backend-start
```

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

The Plone site created by `make install` is served at http://localhost:8080.


### Start Plone Aurora frontend

Create a second shell session in a new window.
Change your current working directory to {file}`project-title`.
Start the Plone frontend with the following command.

```shell
make frontend-start
```

The Plone Aurora frontend server starts up and emits messages to the console, and should end with the following.

```console
  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

Open a browser at the following URL to visit your Plone site.

http://localhost:3000

Your project runs the Plone Aurora frontend against your own Plone backend.
You can develop the backend add-on in {file}`backend/src`, and the Aurora add-on in {file}`frontend/packages`.

You can stop each server with {kbd}`ctrl-c`.

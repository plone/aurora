---
myst:
  html_meta:
    "description": "How to create a package with only a frontend add-on using Cookieplone"
    "property=og:description": "How to create a package with only a frontend add-on using Cookieplone"
    "property=og:title": "How to create a package with only a frontend add-on using Cookieplone"
    "keywords": "Plone, Plone 6, Plone Aurora, create, project, install, Cookieplone"
---

(create-package-label)=

# Create a package: frontend add-on only

This chapter describes how you can create a package with only a frontend add-on using {term}`Cookieplone`.
Cookieplone is the recommended way to create a package as an add-on for Plone that uses the Plone Aurora frontend.
It also includes tools for development and deployment.


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

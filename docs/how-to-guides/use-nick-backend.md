---
myst:
  html_meta:
    "description": "Run Plone Aurora with a Nick backend and test their integration."
    "property=og:description": "Run Plone Aurora with a Nick backend and test their integration."
    "property=og:title": "Use Aurora with Nick"
---

# Use Aurora with Nick

This guide shows you how to run the Plone Aurora core application with [Nick](https://nick.docs.plone.org/) as its backend and run the Nick acceptance test.
The commands use the Docker Compose configuration in the Aurora repository.

## Prerequisites

- Install Docker and Docker Compose, and start the Docker daemon.
- Set up the Aurora repository and its dependencies as described in {doc}`../contributing/developing-core`.
- Make ports `8080` and `3000` available for Nick and Aurora, respectively.

Run the following commands from the root of the Aurora repository.

## Start Nick

Start Nick and PostgreSQL.

```shell
make nick-start
```

The first startup pulls the images, creates the database and blob volumes, and installs Nick's default profile.
The command waits for both services to become healthy.
Nick's API is available at <http://localhost:8080>, and the default profile provides the administrator account `admin` with password `admin`.
The stack uses `plone/nick:3.0.0`, exposes the API on port `8080`, and keeps its data in Docker volumes between starts.

```{warning}
The Compose stack's administrator credentials and secret are intended for local development and testing only.
For a deployment, follow the [Nick deployment documentation](https://nick.docs.plone.org/admin-guide/deployment) and configure your own credentials and secrets.
```

If port `8080` is already in use, set `NICK_PORT` to an available port when starting the stack.
For example, use port `8081` as follows.

```shell
NICK_PORT=8081 make nick-start
```

## Start Aurora

In another terminal, set `PLONE_API_PATH` to Nick's API root and start Aurora.

```shell
PLONE_API_PATH=http://localhost:8080 pnpm start
```

If you changed `NICK_PORT`, use the same port in `PLONE_API_PATH`.
Open <http://localhost:3000> and sign in with the Nick administrator account to edit content.

To connect Aurora to an existing Nick instance, start Aurora with `PLONE_API_PATH` set to that instance's API root.
The URL must be reachable from the Aurora server process.

## Run the acceptance suite with Nick

The shared Nick fixture is experimental and does not yet pass the complete acceptance suite.
It runs the same test files as the Plone backend and reports compatibility failures without skipping them.

Build and start the dedicated test image and database.

```shell
make nick-shared-test-start
```

In another terminal, build and start Aurora against the isolated test backend.

```shell
make nick-shared-test-frontend
```

In a third terminal, run the shared suite.

```shell
pnpm acceptance-test:nick
```

The suite runs against its own Nick and PostgreSQL stack.
Before each test, the acceptance add-on puts the database back into its seeded state.
On the first reset it copies the seeded database to a template database, and each reset then recreates the database from that template, which takes a fraction of a second.
The stack stores blobs in the database, so the reset covers them too.
Its Compose project is `aurora-nick-fixture`, separate from the development stack.
Run only one instance of this suite at a time and use one Playwright worker, as the tests share that isolated stack.
The fixture uses port `55002` by default.
To use another port, set `NICK_ACCEPTANCE_PORT` to the same value when starting the stack, the frontend, and the tests.
When you finish, remove the isolated stack and its test data.

```shell
make nick-shared-test-stop
```

The reset plays the role of the Plone acceptance suite's RobotRemote reset fixture.
The acceptance add-on enables it only when `AURORA_ACCEPTANCE_RESET=1`, as set in its Compose file, at `POST /@aurora-acceptance-reset`.
Never enable it on a site with data you want to keep.
See {doc}`../contributing/acceptance-tests` for the Plone acceptance workflow.

## Stop the stack

Stop the Aurora frontend with {kbd}`Ctrl-C` in its terminal.
Stop Nick and PostgreSQL with the following command.

```shell
make nick-stop
```

This command preserves the database and blob volumes for the next run.

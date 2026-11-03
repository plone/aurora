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

## Run the Nick acceptance test

Start Nick as described above, then build and start the acceptance frontend in a separate terminal.

```shell
make nick-acceptance-frontend
```

If Nick uses a non-default port, set `NICK_PORT` to the same value for this command.
In a third terminal, run the Nick Playwright suite.

```shell
pnpm acceptance-test:nick
```

For a non-default port, set `API_PATH` to Nick's API root when running the test.
For example, if Nick uses port `8081`, run the following command.

```shell
API_PATH=http://localhost:8081 pnpm acceptance-test:nick
```

The test signs in, creates a uniquely named folder and page, checks the page and contents view in Aurora, and deletes the test content.
The Nick suite has its own configuration and does not use the Plone acceptance suite's RobotRemote reset fixture.
It is an initial integration test and does not run the full Plone acceptance suite.
See {doc}`../contributing/acceptance-tests` for the Plone acceptance workflow.

## Stop the stack

Stop the Aurora frontend with {kbd}`Ctrl-C` in its terminal.
Stop Nick and PostgreSQL with the following command.

```shell
make nick-stop
```

This command preserves the database and blob volumes for the next run.

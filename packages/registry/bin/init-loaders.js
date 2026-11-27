#!/usr/bin/env node
// Generates the files of the Plone registry in the `.plone` folder of the app
// in the working directory. The `@plone/aurora` React Router preset does the
// same before React Router reads the app's routes, so an app that uses it only
// needs this command before the tests.
// See https://github.com/remix-run/react-router/issues/13078#issuecomment-2863445977
import { initPloneRegistryLoaders } from '@plone/registry/init-loaders';

initPloneRegistryLoaders();

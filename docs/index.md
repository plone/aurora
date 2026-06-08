---
myst:
  html_meta:
    "description": "Plone Aurora is a React-based frontend for Plone."
    "property=og:description": "Plone Aurora is a React-based frontend for Plone."
    "property=og:title": "Plone Aurora"
    "keywords": "Plone Aurora, Plone, frontend, user interface, React"
---

(volto-index-label)=

# Plone Aurora (@plone/aurora)

Plone Aurora is a fast, elegant, and intuitive React-based frontend for [Plone](https://plone.org) and `plone.restapi` compatible backends.

Plone Aurora is the successor of Plone Volto.
It is under active development in the [Plone Aurora repository](https://github.com/plone/aurora).


## Rationale

Plone Volto turned eight years old in 2025.
The Volto Team architected and implemented Plone Volto using the libraries, frameworks, resources, and best practices that were available at that time.
Since then the React ecosystem has evolved, and so has the way of developing React applications.
React 19 is stable now, settling upon a common paradigm for efficient data fetching in both the server and the client.
Other React frameworks have embraced and leveraged this paradigm, battle testing them in production.

The Volto Team recognized this evolution, and made the decision to adapt the next version of Plone Volto to these modern practices.


## Get started

The following sections guide you to begin your journey with Plone Aurora.


### Integrators

An integrator is someone who uses Plone Aurora to build a project.

-   {doc}`get-started/create-package` is a guide to bootstrap a new Plone Aurora project and start hacking.


### Users

A user of Plone Aurora is someone who edits content in a Plone content management system with Plone Aurora as the user interface.

-   {doc}`training:content-editing/index` provides information about how to manage content in a Plone site.


### Contributors

A contributor is someone who writes code or documentation for the Plone Aurora core packages.

-   {doc}`plone:contributing/first-time` is for people who have not yet made a contribution to Plone, Plone Aurora, or open source software.
-   {doc}`plone:contributing/index` is for people who have not yet signed the Plone Contributor Agreement or contributed to any other project under the GitHub Plone organization, including Plone Aurora.
-   {doc}`contributing/index` is for people who want to contribute to Plone Aurora.


## Table of contents

```{toctree}
:maxdepth: 1

get-started/index
development/index
configuration/index
conceptual-guides/index
how-to-guides/index
reference/index
reference/storybook
upgrade-guide/index
contributing/index
release-management-notes/index
release-notes/index
tutorials/index
```

% Only check change log entries in Plone Aurora documentation—not when it is included in the main Plone documentation—to ensure links work and do not redirect.
% It is OK to ignore warnings, such as the following:
% docs/source/news/5280.bugfix: WARNING: document isn't included in any toctree
````{ifconfig} context in ("plone-aurora",)
```{toctree}
news*
```
````

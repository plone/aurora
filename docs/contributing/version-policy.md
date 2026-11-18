---
myst:
  html_meta:
    "description": "Plone Aurora release management uses Semantic Versioning to communicate bugfixes, new features, and breaking changes."
    "property=og:description": "Plone Aurora release management uses Semantic Versioning to communicate bugfixes, new features, and breaking changes."
    "property=og:title": "Version policy"
    "keywords": "Plone Aurora, Plone, frontend, React, Release, Version, Semantic"
---

(version-policy)=

# Version policy

This chapter describes the versions of software that Plone Aurora supports and how Plone Aurora communicates its releases through its branch policy.


(version-policy-backend-compatibility)=

## Backend compatibility

Plone Aurora works with a backend that implements the [Plone REST API](https://github.com/plone/plone.restapi): [Plone (`Products.CMFPlone`)](https://github.com/plone/Products.CMFPlone) with `plone.restapi`, or [Nick](https://github.com/plone/nick).


(version-policy-plone)=

### Plone

We will always support the [latest major Plone release](https://plone.org/download/releases) and the version of Plone REST API that ships with it.

Plone Aurora requires Plone 6.2 or later, with `plone.restapi` 10.3.0 or later.
`plone.restapi` 10.3.0 indexes the text of the `plate` regions that store the page, checks their links for link integrity, and converts the links of the blocks in them to `resolveuid` links.
When your Plone release ships an older version of `plone.restapi`, pin it to 10.3.0 or later in your backend.

The backend also needs `plone.volto` 6.2.1 or later, with its `plone.volto:aurora` profile applied.
Since 6.1.0, the `plone.volto:default` profile adds the `personal_tools` actions with the links of the Volto toolbar, and the Personal tools menu of Plone Aurora shows these actions instead of its own links.
The `plone.volto:aurora` profile replaces them with the links of Plone Aurora.
When your Plone release ships an older version of `plone.volto`, pin it to 6.2.1 or later in your backend.

The supported versions of Python are those of the Plone release that you use.
See the [Plone release schedule](https://plone.org/download/release-schedule).

We recommend using the known good set (KGS) of package versions that are specified in the Plone release.

```{seealso}
See also [Plone REST API Python and Plone compatibility](https://github.com/plone/plone.restapi#python--plone-compatibility).
```


(version-policy-nick)=

### Nick

With a Nick backend, Plone Aurora requires Nick 3.0.1 or later.
Nick 3.0.1 reads the `plate` regions that store the page: it builds the Markdown of a page from its `main` region, the text for `SearchableText` from all its `plate` regions, and its block types from the blocks in them.
Older versions of Nick only read the `__somersault__` block that Plone Aurora used before.


(version-policy-node-js)=

## Node.js

Plone Aurora runs using [Node.js](https://nodejs.org/en).
Plone Aurora supports only the latest two [LTS versions of Node.js](https://github.com/nodejs/release#release-schedule).
We recommend using the current LTS version.

| Node.js | Plone Aurora         |
| ------- | ------------- |
| 24, 26  | 1.0.0 (alpha) |

(version-policy-supported-browsers)=

## Supported web browsers

```{include} ../_inc/_install-browser-reqs.md
```


## Branch policy

```{include} ../_inc/_branch-policy.md
```


(version-policy-semantic-versioning-label)=

### Semantic Versioning

Plone Aurora uses [Semantic Versioning](https://semver.org/) to communicate bugfixes, new features, and breaking changes in a release.
We use a three-digit dotted version scheme that follows the [Breaking-Feature-Bugfix](
https://medium.com/sapioit/why-having-3-numbers-in-the-version-name-is-bad-92fc1f6bc73c) naming convention.

The following sections show examples of the terms and changes in version numbering used to indicate each type of release.


#### Breaking (or major release)

A breaking or major release indicates a breaking change that might break an application or third-party add-on that relies on Plone Aurora.

```text
4.2.0 -> 5.0.0
```

For every breaking release, detailed documentation of the breaking changes is in our {doc}`../upgrade-guide/index`.


#### Feature

A feature release indicates that new features have been added to Plone Aurora in a non-breaking fashion.

```text
4.2.0 -> 4.3.0
```

You should expect no breaking changes in a feature release, including new DOM elements.
However, the user interface may change.
If so, the feature must be under a feature flag and disabled by default, such that it is opt-in.


#### Bugfix

A bugfix release indicates one or more bugs in Plone Aurora have been fixed.

```text
4.2.0 -> 4.2.1
```

There should be no breaking changes or changes to the user interface in a bugfix release.
It just fixed a bug.

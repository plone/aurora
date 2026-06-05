---
myst:
  html_meta:
    "description": "This upgrade guide lists all breaking changes in Plone Aurora, and explains the necessary steps to upgrade your add-on for the latest version."
    "property=og:description": "This upgrade guide lists all breaking changes in Plone Aurora, and explains the necessary steps to upgrade your add-on for the latest version."
    "property=og:title": "Plone Aurora upgrade guide"
    "keywords": "Plone Aurora, Plone, frontend, React, upgrade, guide"
---

(plone-aurora-upgrade-guide)=

# Upgrade guide

This upgrade guide lists all breaking changes in Plone Aurora, and explains the necessary steps to upgrade your add-on for the latest version.
Plone Aurora uses Semantic Versioning, as described in {doc}`../contributing/version-policy`.

````{note}
[Cookieplone](https://github.com/plone/cookieplone) is the official project generator for Plone.
We keep Cookieplone up to date and in sync with the current Plone Aurora release.

To make it easier for you to maintain your projects, you should keep all your code inside your project add-ons.
If you do so, when you want to upgrade your project, you can generate a new project using Cookieplone with the same name as your old one, and copy over your add-ons to the new project.
It is usually better and quicker to move your items into new locations and copy your dependencies than dealing with following the upgrade steps, regardless of whether you have modified the boilerplate.

```{seealso}
{ref}`upgrade-18-cookieplone-label`
```
````

(plone-aurora-upgrade-guide-1.x.x)=

## Upgrading to Plone Aurora

---
myst:
  html_meta:
    "description": "Add a control panel to a Plone site, and show it in the Plone Aurora site setup"
    "property=og:description": "Add a control panel to a Plone site, and show it in the Plone Aurora site setup"
    "property=og:title": "Add a control panel"
    "keywords": "Plone Aurora, control panels, site setup, configlets, registry, plone.restapi, add-ons"
---

(add-a-control-panel-label)=

# Add a control panel

A control panel is a page where site administrators change a group of site-wide settings.
Plone Aurora lists every control panel on its site setup page, at {file}`/controlpanel`, and shows each one at {file}`/controlpanel/<id>`.

This guide shows how to add a control panel from your add-on, how to give it an icon and a description on the site setup page, and how to replace its form with a page of your own.

## How Plone Aurora finds control panels

Plone Aurora doesn't keep a list of control panels.
It asks the backend, through the `@controlpanels` endpoint of `plone.restapi`.
The backend lists a control panel when both of the following exist.

-   A configlet in the `portal_controlpanel` tool, which you add with a {file}`controlpanel.xml` GenericSetup profile.
    It gives the control panel its title, its group, its icon, and the permission needed to see it.
-   A `plone.restapi` control panel adapter, which tells the REST API which configlet it belongs to and which registry schema holds its settings.

When the control panel has a schema, Plone Aurora renders its form with the same widgets as the content forms, and saves it through `PATCH @controlpanels/<id>`.
You don't need any frontend code for it.

## Add the control panel in the backend

The following examples add a control panel named `my-settings` to an add-on called `my.addon`.

### Define the settings

Define the settings as a `zope.schema` interface, and store them in the Plone registry.

```python
# my/addon/interfaces.py
from zope import schema
from zope.interface import Interface


class IMySettings(Interface):
    api_url = schema.URL(
        title="API URL",
        description="The address of the service that this site talks to.",
        required=True,
    )
    timeout = schema.Int(
        title="Timeout",
        description="How many seconds to wait for the service.",
        default=10,
    )
```

```xml
<!-- my/addon/profiles/default/registry.xml -->
<registry>
  <records interface="my.addon.interfaces.IMySettings" />
</registry>
```

### Add the configlet

Add the configlet to the `portal_controlpanel` tool.
Its `category` is the group it appears in.
Plone's groups are `plone-general`, `plone-content`, `plone-users`, `plone-security`, `plone-advanced`, and `Products`, which is the add-on configuration group.
Plone Aurora doesn't use the `url_expr` of the configlet, which is the address of the control panel in Classic UI.

```xml
<!-- my/addon/profiles/default/controlpanel.xml -->
<?xml version="1.0" encoding="utf-8"?>
<object name="portal_controlpanel"
        xmlns:i18n="http://xml.zope.org/namespaces/i18n"
        i18n:domain="my.addon"
        purge="False"
>
  <configlet action_id="my-settings"
             appId="my.addon"
             category="Products"
             condition_expr=""
             icon_expr="string:gear"
             title="My settings"
             url_expr="string:${portal_url}/@@my-settings"
             visible="True"
             i18n:attributes="title"
  >
    <permission>Manage portal</permission>
  </configlet>
</object>
```

### Add the control panel adapter

Register an adapter that extends `RegistryConfigletPanel`.
Its `configlet_id` and `configlet_category_id` must match the configlet.
Set `schema_prefix` to `None` when you register the records by their interface, as in the previous {file}`registry.xml`.

```python
# my/addon/restapi.py
from my.addon.interfaces import IMySettings
from plone.restapi.controlpanels import RegistryConfigletPanel
from plone.restapi.interfaces import IControlpanelLayer
from zope.component import adapter
from zope.interface import Interface


@adapter(Interface, IControlpanelLayer)
class MySettingsControlpanel(RegistryConfigletPanel):
    schema = IMySettings
    schema_prefix = None
    configlet_id = "my-settings"
    configlet_category_id = "Products"
```

The name of the adapter is the id of the control panel in its address.

```xml
<!-- my/addon/configure.zcml -->
<configure zcml:condition="installed plone.restapi">
  <adapter
      factory=".restapi.MySettingsControlpanel"
      name="my-settings"
      />
</configure>
```

After you install or upgrade the add-on, `GET @controlpanels` lists the new control panel, and Plone Aurora shows it on the site setup page, in the group of its configlet.
It opens at {file}`/controlpanel/my-settings`.

## Show it on the site setup page

The site setup page lists the control panels in the order the backend sends them.
Plone orders the groups, and the control panels within each group by their translated title.

Each control panel shows an icon and, if there is one, a short description.

### Give it an icon

Plone Aurora picks the icon of a control panel by its id from `config.settings.controlPanelsIcons`.
Control panels without an icon there get the `default` one.
Add yours in the configuration of your add-on.

```ts
import type { ConfigType } from '@plone/registry';
import SettingsSVG from '@plone/icons/svg/settings.svg?react';

export default function install(config: ConfigType) {
  config.settings.controlPanelsIcons = {
    ...config.settings.controlPanelsIcons,
    'my-settings': SettingsSVG,
  };

  return config;
}
```

For the icons you can use, see {doc}`icons`.

### Give it a description

The description comes from the `cmsui.controlpanelDescriptions.<id>` translation.
It shows under the title on the site setup page, and under the heading of the control panel.
Add it to the translation files of your add-on.

```json
{
  "cmsui": {
    "controlpanelDescriptions": {
      "my-settings": "The service this site talks to"
    }
  }
}
```

Plone Aurora merges the translation files of all add-ons, so this adds your description without replacing the others.
A project can change the description of any control panel in the same way.
For how to organize translation files, see {doc}`/development/i18n`.

### Hide a control panel

`config.settings.filterControlPanels` receives the control panels that the backend lists, and returns the ones the site setup page shows.
By default, it hides the `markup` and `content-rules` control panels.
Replace it to hide others.

```ts
config.settings.filterControlPanels = (controlpanels) =>
  controlpanels.filter(
    (controlpanel) => !controlpanel['@id'].endsWith('/my-settings'),
  );
```

## Replace the form with a page of your own

Some control panels need more than a form of settings, like the content types control panel.
To render your own page for a control panel, register a route for its path in the configuration of your add-on.
A route for {file}`controlpanel/my-settings` takes precedence over the generic {file}`controlpanel/:id` route.

Render it inside the layout of `@plone/cmsui`, so it gets the toolbar, and give the layout route an `id` of its own, since `@plone/cmsui` already registers that layout.

```ts
config.registerRoute({
  type: 'layout',
  file: '@plone/cmsui/routes/layout.tsx',
  options: { id: 'my-addon-controlpanel-layout' },
  children: [
    {
      type: 'route',
      path: 'controlpanel/my-settings',
      file: '@my-addon/routes/MySettings.tsx',
    },
  ],
});
```

For more about routes, see {doc}`routes`.

A control panel that exists only in the frontend, without a configlet in the backend, doesn't appear on the site setup page on its own.
Add it to `config.settings.controlpanels`, and the site setup page lists it with the ones from the backend.
The last segment of its `@id` is its id in the address, and its `group` is the title of the group it joins.

```ts
config.settings.controlpanels = [
  ...(config.settings.controlpanels ?? []),
  {
    '@id': '/my-settings',
    title: 'My settings',
    group: 'Add-on Configuration',
  },
];
```

---
myst:
  html_meta:
    "description": "How to customize the toolbar using pluggables and portal actions"
    "property=og:description": "How to customize the toolbar using pluggables and portal actions"
    "property=og:title": "Customize the toolbar"
    "keywords": "Plone, Volto, Plone Aurora, Toolbar, Pluggables, Personal tools, More menu, actions, personal_tools, more_menu"
---

# Customize the toolbar

The toolbar uses the pluggable system for extensibility.
It exposes two pluggables:

`toolbar-top`
:   Rendered at the top of the toolbar.
    Typically used for action buttons (save, cancel, edit, add).

`toolbar-bottom`
:   Rendered at the bottom of the toolbar.
    Typically used for settings or navigation.

## Register a toolbar button

Wrap your component in a `<Plug>` and place it inside the existing `<PluggablesProvider>` in your layout.

```tsx
import { Plug } from '@plone/layout/components/Pluggable';
import MyIcon from './my-icon.svg?react';
import { Link } from 'react-aria-components';
import { useLocation } from 'react-router';

// Inside your layout component:
const location = useLocation();

<Plug pluggable="toolbar-top" id="my-button">
  <Link href={`/some-action${location.pathname}`} aria-label="My action">
    <MyIcon />
  </Link>
</Plug>
```

Any data your component needs—including content, location or navigation—must be fetched via hooks inside the component itself or captured in the `<Plug>` closure.
The toolbar does not pass props down to plugged components.

(customize-toolbar-add-a-menu-to-the-toolbar-label)=

## Add a menu to the toolbar

Menus in the toolbar require the `ToolbarMenu` wrapper component from `@plone/layout`.
Use it in place of the standard `Menu` component.
The menu children follow the same API as [React Aria's Menu](https://react-aria.adobe.com/Menu).

### Create the menu component

First, create the menu component, using the following example code.

```tsx
import { ToolbarMenu } from '@plone/layout/components/Toolbar/ToolbarMenu';
import { MenuItem } from '@plone/components';
import { Header, Menu, MenuSection, Text } from 'react-aria-components';
import type { Content } from '@plone/types';
import MyIcon from './my-icon.svg?react';

import menuStyles from './MyMenu.css?inline';

interface MyMenuProps {
  content: Content;
}

export const MyMenu = ({ content }: MyMenuProps) => {
  return (
    <ToolbarMenu icon={<MyIcon />} styles={menuStyles}>
      <Menu className="menu-my-menu">
        <MenuSection>
          <Header>My menu</Header>
          <MenuItem id="item-1" href="/some-action">
            <Text slot="label">Item 1</Text>
          </MenuItem>
        </MenuSection>
      </Menu>
    </ToolbarMenu>
  );
};
```

`ToolbarMenu` extends `MenuTrigger` and thus `BasicMenuTriggerProps`.
In addition to those props, it accepts the following:

`icon`
:   The trigger element rendered in the toolbar, typically an SVG icon.

`styles`
:   A CSS string imported with `?inline`.
    Injects the styles into the toolbar's shadow root so that your menu styles apply correctly.

### Register the menu as a pluggable

Then, register the menu as a pluggable, using the following code.

```tsx
import { Plug } from '@plone/layout/components/Pluggable';
import { MyMenu } from './MyMenu';
import { useRouteLoaderData } from 'react-router';
import type { RootLoader } from '@plone/aurora/app/root';

// Inside your layout component:
const rootData = useRouteLoaderData<RootLoader>('root');

<Plug pluggable="toolbar-top" id="my-menu">
  <MyMenu content={rootData.content} />
</Plug>
```

Using the same `id` as an existing plug replaces it.

For a full example, see the [`ContentTypesMenu`](https://github.com/plone/aurora/blob/main/packages/publicui/components/Toolbar/ContentTypesMenu.tsx) component in `@plone/publicui`.

See the {doc}`plone:volto/development/pluggables` for the full pluggable API reference.

(customize-toolbar-menu-actions-label)=

## Customize the Personal tools and More menus with actions

Two of the toolbar menus read their links from the backend's portal actions:

Personal tools
:   The `PersonalTools` component in `@plone/layout`, plugged into `toolbar-bottom` with the id `personal-tools`.
    It shows the user's name, email and portrait, followed by links.
    It reads the `personal_tools` action category.

More
:   The `MoreMenu` component in `@plone/layout`, plugged into `toolbar-top` with the id `button-more`.
    It shows the page settings of the current content, followed by links.
    It reads the `more_menu` action category.

Both categories are optional.
When the backend doesn't provide one, or provides it empty, the menu falls back to its built-in links.
This lets you change the links of these menus from the backend, without code in the frontend.

### How the menus get the actions

Plone Aurora expands `actions` in the content request by default, as described in {doc}`add-content-expanders`.
The menus read the `personal_tools` and `more_menu` keys from `content['@components'].actions`.
The backend evaluates each action's URL expression, condition and permissions for the current user and context, so the menus only receive the actions that the user may see.

The `ActionsResponse` type in `@plone/types` declares both keys as optional:

```ts
export interface ActionsResponse {
  // ...
  more_menu?: Action[];
  personal_tools?: Action[];
}
```

### Personal tools

When `personal_tools` contains actions, the menu renders one item per action, in the order the backend returns them.
Each item uses the action's `title` as its label and its `url` as its link.

Otherwise the menu shows its built-in links:

| Item        | Link                      | Shown                                                      |
| ----------- | ------------------------- | ---------------------------------------------------------- |
| Profile     | `/@@personal-information` | always                                                     |
| Preferences | `/@@personal-preferences` | always                                                     |
| Site setup  | `/controlpanel`           | when the `user` category contains the `plone_setup` action |
| Log out     | `/logout`                 | always                                                     |

The actions replace all of the built-in links, including Log out.
If you provide `personal_tools`, include a Log out action in it.

### More

The page settings at the top of the More menu don't come from actions, and are always shown when they apply: the workflow state and its transitions, the layout selector, and the last modification date.

When `more_menu` contains actions, the link section below the page settings renders one item per action, using its `title` and `url`.

Otherwise the menu shows its built-in links, each one only when the related action or permission is available for the current content:

| Item                 | Link                                | Shown when                                              |
| -------------------- | ----------------------------------- | ------------------------------------------------------- |
| History              | `/@@history/<path>`                 | the `object` category contains `history`                |
| Sharing              | `/@@sharing/<path>`                 | the `object` category contains `local_roles`            |
| URL management       | `/@@aliases/<path>`                 | the `object_buttons` category contains `redirection`    |
| Links and references | `/@@links-to-item/<path>`           | the user can edit the content, except on the site root  |
| Rules                | `/@@rules/<path>`                   | the `object` category contains `contentrules`           |
| Manage translations  | `/@@manage-translations/<path>`     | the user can edit the content and the site is multilingual |
| Create working copy  | runs the check out                  | the `object_buttons` category contains `iterate_checkout` |
| Apply working copy   | runs the check in                   | the `object_buttons` category contains `iterate_checkin` |
| Discard working copy | asks for confirmation, then discards | the `object_buttons` category contains `iterate_checkin` |
| View working copy    | the working copy's URL              | the content has a working copy                          |

History is not shown on the site root.

The actions replace the whole link section, including the working copy items.
If you provide `more_menu` and your site uses working copies, link to those operations from your own actions.

### Add the actions in the backend

Add the action categories to the {file}`actions.xml` file of your backend add-on's GenericSetup profile.
The following example adds a `personal_tools` category with the same links as the built-in menu.

```{code-block} xml
:caption: profiles/default/actions.xml
<?xml version="1.0" encoding="utf-8"?>
<object name="portal_actions"
        meta_type="Plone Actions Tool"
        xmlns:i18n="http://xml.zope.org/namespaces/i18n"
>
  <object name="personal_tools"
          meta_type="CMF Action Category"
  >
    <property name="title">Personal tools</property>
    <object name="profile"
            meta_type="CMF Action"
            i18n:domain="plone"
    >
      <property name="title"
                i18n:translate=""
      >Profile</property>
      <property name="url_expr">string:/@@personal-information</property>
      <property name="available_expr">python:member is not None</property>
      <property name="permissions">
        <element value="View" />
      </property>
      <property name="visible">True</property>
    </object>
    <object name="preferences"
            meta_type="CMF Action"
            i18n:domain="plone"
    >
      <property name="title"
                i18n:translate=""
      >Preferences</property>
      <property name="url_expr">string:/@@personal-preferences</property>
      <property name="available_expr">python:member is not None</property>
      <property name="permissions">
        <element value="View" />
      </property>
      <property name="visible">True</property>
    </object>
    <object name="plone_setup"
            meta_type="CMF Action"
            i18n:domain="plone"
    >
      <property name="title"
                i18n:translate=""
      >Site Setup</property>
      <property name="url_expr">string:/controlpanel</property>
      <property name="permissions">
        <element value="Plone Site Setup: Overview" />
      </property>
      <property name="visible">True</property>
    </object>
    <object name="logout"
            meta_type="CMF Action"
            i18n:domain="plone"
    >
      <property name="title"
                i18n:translate=""
      >Log out</property>
      <property name="url_expr">string:/logout</property>
      <property name="available_expr">python:member is not None</property>
      <property name="permissions">
        <element value="View" />
      </property>
      <property name="visible">True</property>
    </object>
  </object>
</object>
```

A `more_menu` category works the same way, with `more_menu` as the category name.

Keep the following in mind when you write the actions.

-   The menus use the action's `url` as the link, exactly as the backend returns it.
    It must be a URL that Plone Aurora can route, such as {samp}`/@@personal-information`, and not a backend view such as {samp}`@@personal-information` on the Plone site.
-   Write site-relative URLs, starting with `/`.
    An expression such as `string:${portal_url}/...` returns the backend's URL, which leaves Plone Aurora unless the frontend and backend share the same host.
-   The menus don't use the action's `icon_expr`, `description` or `link_target`.
-   Hidden actions, and actions whose condition or permissions don't match the current user, are not returned by the backend, so they don't appear in the menu.

### Replace a menu from the frontend

To change these menus beyond what actions allow, plug your own component with the same id, as described in {ref}`customize-toolbar-add-a-menu-to-the-toolbar-label`.
Use the id `personal-tools` in `toolbar-bottom` for Personal tools, and `button-more` in `toolbar-top` for More.

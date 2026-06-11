---
myst:
  html_meta:
    "description": "How to rename, change state, tag, and edit properties for one or more items in the Plone Aurora folder contents view"
    "property=og:description": "How to rename, change state, tag, and edit properties for one or more items in the Plone Aurora folder contents view"
    "property=og:title": "Manage folder contents in bulk"
    "keywords": "Plone Aurora, contents, rename, workflow, tags, properties, bulk"
---

# Manage folder contents in bulk

This guide shows you how to rename items, change their workflow state, edit their tags, and edit their properties from the folder contents view.
Each action works on one or several items at once.

## Open the folder contents view

Navigate to a folder, then select the {guilabel}`Contents` button <img alt="Contents" src="../_static/icons/contents.svg" class="inline"> in the toolbar.
The view lists the items in the folder together with a toolbar of actions.

## Select the items to act on

To select items to act on, check their checkboxes in the first column.
To either select or deselect all items on the current page, check the checkbox in the table header.

The {guilabel}`Rename`, {guilabel}`Change state`, {guilabel}`Tags`, and {guilabel}`Properties` actions stay disabled until you select at least one item.
Each action applies to the current selection.

## Rename items

1. Select the items to rename.
2. Select {guilabel}`Rename` in the toolbar.
3. Edit the {guilabel}`Short name`, the {guilabel}`Title`, or both for each item in the dialog.
4. Select {guilabel}`Rename` in the dialog to apply the changes.

The {guilabel}`Short name` is the last segment of the item's URL.

````{note}
Changing the {guilabel}`Short name` changes the item's URL.
Aurora automatically redirects the old URL to the new one, so existing links and bookmarks keep working.

```{todo}
Document the URL management control panel once it is available.
See [URL management: redirect control panel + documentation](https://github.com/plone/aurora/issues/121).
```
````

## Change the workflow state

1. Select the items whose state you want to change.
2. Select {guilabel}`Change state` in the toolbar.
3. Choose a transition from the list.
4. Optionally add a comment.
5. Optionally select {guilabel}`Apply to contained items` to apply the transition recursively.
6. Select {guilabel}`Change state` in the dialog to apply the transition.

The list offers only the transitions that are available for every selected item.
If the selected items share no common transition, the dialog tells you so, and you can't apply a transition.

## Edit tags

1. Select the items to tag.
2. Select {guilabel}`Tags` in the toolbar.
3. Remove a tag by selecting the {guilabel}`×` next to it.
4. Add a tag by typing it in the input and pressing {kbd}`Enter`.
5. Select {guilabel}`Save tags` to apply the changes.

The field shows the tags already present on the selection.
The input suggests existing tags from the site.
Adding a tag applies it to every selected item, and removing a tag removes it from every selected item.

## Edit properties

1. Select the items whose properties you want to edit.
2. Select {guilabel}`Properties` in the toolbar.
3. Edit any of the {guilabel}`Publishing date`, {guilabel}`Expiration date`, {guilabel}`Rights`, {guilabel}`Creators`, or {guilabel}`Exclude from navigation`.
4. Select {guilabel}`Save properties` to apply the changes.

The dialog saves only the fields you change.
Fields you leave untouched keep their current values on each item.

When you select several items whose values differ for a field, that field shows {guilabel}`Mixed values`.
Leave it untouched to keep each item's own value, or set a value to apply it to every selected item.

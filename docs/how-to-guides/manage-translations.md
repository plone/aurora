---
myst:
  html_meta:
    "description": "How to link, unlink, and create translations of a content item in the Plone Aurora manage translations view"
    "property=og:description": "How to link, unlink, and create translations of a content item in the Plone Aurora manage translations view"
    "property=og:title": "Manage translations"
    "keywords": "Plone Aurora, translations, multilingual, language, link, unlink"
---

# Manage translations

This guide shows you how to link content items in different languages together as translations of each other, how to unlink them, and how to create a missing translation.
Translations work on a multilingual site, where each language has its own root folder, such as `/en` and `/de`.
Refer to {doc}`/how-to-guides/translate-content` for how to configure a multilingual site.

## Open the manage translations view

Log in to your site, then navigate to `https://<site>/@@manage-translations/<path-of-the-content>`, where `<path-of-the-content>` is the path of the item whose translations you want to manage.
For example, to manage the translations of the page at `/en/my-page`, navigate to `https://<site>/@@manage-translations/en/my-page`.

The page heading {guilabel}`Manage translations for "<title>"` confirms which item you're working on.
Below it, a table with the columns {guilabel}`Language`, {guilabel}`Path`, and {guilabel}`Tools` lists one row for each language of the site.
The row of the item's own language appears in bold and offers no tools.
Every other row shows either the path of the linked translation or {guilabel}`No translation`.
Select a path in the {guilabel}`Path` column to open that item.
To leave the view, select the {guilabel}`Back` button in the toolbar.

```{note}
The view works only for content inside a language folder.
For content outside a language folder, such as the site root, the view responds with an {guilabel}`Error 400` page instead.
```

## Link an existing translation

If the translation already exists as an item on the site, link it.

1. In the row of the language, select the {guilabel}`+` button, labeled {guilabel}`Link an existing <language> translation`.
2. In the object browser, choose the item to link as the translation.

The object browser starts at the root folder of that language.
To find an item in another folder, select the {guilabel}`Search content` button, and search the whole site.
A toast {guilabel}`Translation linked` confirms the link, and the row now shows the path of the linked item.

If the server rejects the link, for example when the chosen item has the same language as the current item, an error toast {guilabel}`Translation update failed` shows the reason.

## Create a translation

If the translation doesn't exist yet, create it.

In the row of the language, select the language icon, labeled {guilabel}`Create the <language> translation`.
This opens the translation view for that language, with the original next to your translation.
Refer to {doc}`/how-to-guides/translate-content` for how to work in the translation view.

## Unlink a translation

To unlink a translation, select the chain icon in its row, labeled {guilabel}`Unlink the <language> translation`.
Aurora removes the link between the two items immediately and confirms it with a toast {guilabel}`Translation unlinked`.
Unlinking doesn't delete any content.
Both items stay on the site, but they're no longer connected as translations of each other.

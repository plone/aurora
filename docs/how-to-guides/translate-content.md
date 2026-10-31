---
myst:
  html_meta:
    "description": "How to create a translation of a content item in Plone Aurora while reading the original side by side"
    "property=og:description": "How to create a translation of a content item in Plone Aurora while reading the original side by side"
    "property=og:title": "Translate content"
    "keywords": "Plone Aurora, translate, translation, multilingual, babel"
---

# Translate content

This guide shows you how to create a translation of a content item while reading the original side by side.

## Requirements

Your site must be multilingual.
Install the `plone.app.multilingual` add-on, and configure at least two site languages in the {guilabel}`Language` control panel.
The backend then provides one root folder per language, and Aurora places every translation in the folder of its language.

## Open the translation view

Open the translation view directly by URL.
Append the path of the item to translate to `@@translate`, and pass the target language as a query parameter.

```text
https://example.com/@@translate/<path-to-item>?language=<language-code>
```

For example, to translate the English page at `/en/welcome` to German, open the following URL.

```text
https://example.com/@@translate/en/welcome?language=de
```

If a translation in the target language already exists, the view redirects to the edit view of that translation.

```{todo}
Describe the user interface entry point for the translation view, once the toolbar provides a {guilabel}`Translate` action.
See [issue 21](https://github.com/plone/aurora/issues/21) and [issue 31](https://github.com/plone/aurora/issues/31).
```

## Translate the content

The view shows the original on the left, and the new translation on the right.
The {guilabel}`Blocks` and {guilabel}`Content` tabs switch both columns at the same time.

In the {guilabel}`Blocks` tab, the left column shows the rendered original, and the right column shows the block editor for the translation.
The translation starts with the same block structure as the original.

-   Text blocks contain the original text.
    Overwrite it with your translation.
-   All other blocks, such as a teaser, appear empty at their original position.
    Fill them as you would fill a manually added block.

In the {guilabel}`Content` tab, the left column shows the field values of the original, and the right column shows the fields of the translation.
The fields start empty and show the values of the original as placeholders.
Enter the translated values, starting with the {guilabel}`Title`.

## Save the translation

Select the {guilabel}`Save` button in the toolbar.
Aurora creates the translation in the root folder of the target language, links it to the original, and opens the edit view of the new translation.

Fields that you leave empty stay empty on the translation.
The link between the original and the translation lets visitors switch between the two language versions of the item.

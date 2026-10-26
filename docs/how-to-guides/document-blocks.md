---
myst:
  html_meta:
    "description": "Document your blocks in Markdown files next to them, for agents, reference documentation, and other developers"
    "property=og:description": "Document your blocks in Markdown files next to them, for agents, reference documentation, and other developers"
    "property=og:title": "Document your blocks"
    "keywords": "Plone Aurora, blocks, documentation, agents, LLM, Markdown, @blocks-schema"
---

# Document your blocks

A block's schema says which fields it has, but not what they mean, which values belong together, or what a complete block looks like.
Plone Aurora lets each block carry its own documentation, written in Markdown next to the block, so that anyone who writes its data gets it right: agents, such as an LLM that creates pages through the Plone MCP server, reference documentation generated for a site, and developers.

Only the frontend knows which blocks a site has, so Plone Aurora publishes the documentation, together with each block's schema and variations, at the `@blocks-schema` endpoint.
See {doc}`../reference/blocks-schema-endpoint`.

## Write the documentation of a block

Write it in a Markdown file next to the block, with a name that ends in `.block.md`, such as {file}`docs.block.md`.
Its frontmatter names the block by its ID.

````markdown
---
block: mainslider
---

Shows a slider with the pages chosen by an editor.

Each slide links to a content item and shows its lead image.

### Fields

- `slides`: a list of `{ "href": [{ "@id": path }] }` objects.

### Example

```json
{
  "@type": "mainslider",
  "slides": [{ "href": [{ "@id": "/news/annual-report" }] }]
}
```
````

There is nothing to register.
When the app builds, the Plone registry Vite plugin collects the `*.block.md` files of every add-on, in the order they are loaded, into the server-only `@plone/registry/blocks-docs` module.
Only the `@blocks-schema` endpoint uses it, so the documentation is not sent to the browser.
The endpoint only returns it to authenticated users.
Still, any user who can log in can read it, so don't put anything in it that only some users should see.

If two files document the same block, the one from the add-on that loads later wins.
This lets an add-on replace the documentation of a core block.

Follow these conventions, so the documentation reads well in every format.

-   The first paragraph is the summary of the block.
    The endpoint uses it as the block's `description` in the list of blocks.
-   Use `###` for headings inside the documentation.
    The endpoint puts each block under a `##` heading.
-   Describe the stored data, not the editor interface.
-   Add at least one complete example of the block data in a `json` code block, with the block's `@type`.
    The example is the block's data only: the document format explains how a block is stored as a `ploneBlock` node of the page.
-   Don't repeat what the schema already says.
    The endpoint returns the schema next to the documentation.
-   Don't write values that depend on the configuration or on the site into the documentation.
    Use a placeholder, or refer to where they come from, such as the `@querystring` endpoint of the Plone REST API.

## Document a variation

To document a variation, add another file with the `variation` in its frontmatter.

```markdown
---
block: listing
variation: summary
---

Shows the title, description and image of each item.
```

## Placeholders

`{{key}}` in the documentation is replaced with the value of that key in the block configuration.
A list becomes a comma-separated list of code spans, and a string, a number, or a boolean is inserted as it is.

```markdown
It holds up to {{maxLength}} blocks.
The allowed blocks are {{allowedBlocks}}.
```

Only top-level keys of the block configuration are available.
If a key has no such value, the placeholder is removed and the server logs a warning.
To write `{{` literally, escape it as `\{{`.

## Tailor the documentation

For special cases, a block's configuration can have a `docs` function.
It receives the block configuration and the `markdown` of the block's file, with its placeholders filled in, and returns the documentation to use.

```ts
config.blocks.blocksConfig.mainslider = {
  // ...
  docs: ({ blockConfig, markdown }) =>
    `${markdown}\n\nThis site shows ${blockConfig.slidesToShow} slides at a time.`,
};
```

If it throws or doesn't return a string, the endpoint uses the file's documentation.

## The document format

A page stores its content as one Plate document, in the `__somersault__` block.
Its format is documented in {file}`packages/plate/document.block.md`, a file whose frontmatter names `__somersault__`.
The endpoint returns it as the `document` of the list of blocks, not as a block.

```{note}
The documentation is in English and is not translated.
```

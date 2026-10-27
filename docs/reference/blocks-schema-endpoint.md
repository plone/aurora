---
myst:
  html_meta:
    "description": "Reference of the @blocks-schema endpoint of Plone Aurora, which returns the documentation, schemas, and variations of a site's blocks"
    "property=og:description": "Reference of the @blocks-schema endpoint of Plone Aurora, which returns the documentation, schemas, and variations of a site's blocks"
    "property=og:title": "The @blocks-schema endpoint"
    "keywords": "Plone Aurora, blocks, schema, endpoint, Markdown, agents, MCP"
---

# The `@blocks-schema` endpoint

The `@blocks-schema` endpoint describes what a page of the site can be built with: the native elements of the page document, such as paragraphs, headings, or tables, and the blocks registered on the site.
For each block, it returns its documentation, the schema of its data, and its variations.
For each element, it returns its documentation, with the shape of its node.
It also returns the format of the page document that holds them.
To learn how to write the documentation that it returns, see {doc}`../how-to-guides/document-blocks`.

The endpoint has the same responses as the one of the Volto server, so clients such as the Plone MCP server work with both.
It only exists at the root of the site, though.
Unlike Volto, Plone Aurora doesn't answer it below a content path, such as `/news/@blocks-schema`.

```{note}
`@blocks-schema` is served by Plone Aurora, not by the Plone REST API.
Request it from the frontend URL, for example `http://localhost:3000/@blocks-schema`.
```

## Authentication

The endpoint requires an authenticated user, because block documentation only exists on the server and can contain information meant for editors.
Any valid Plone token works, whatever the user's roles, including users defined in the Zope root, such as `admin`.

Send the token in one of these ways.

-   The session cookie, which Plone Aurora sets when a user logs in.
-   An `Authorization: Bearer <token>` header, which suits agents and other API clients.
    It takes precedence over the cookie.
    Plone Aurora reads this header only for this endpoint.

Get a token from the `@login` endpoint of the Plone REST API.

Plone Aurora can't verify a token by itself, so it asks the Plone REST API for the token's user.
It remembers a valid token for one minute at most, and never past the token's expiry.
Malformed and expired tokens are rejected without asking the Plone REST API.

Without a valid token, the endpoint returns `401 Unauthorized` with a `WWW-Authenticate: Bearer` header.

## List the blocks

```http
GET /@blocks-schema HTTP/1.1
Authorization: Bearer <token>
```

This returns the URL, ID, title, kind, and summary of every documented element and every registered block, and the documentation of the page document format in `document`.
The summary is the first paragraph of the documentation.
Each item's `@id` is the absolute URL of its details, so a client follows it to get the item's documentation and schema.
The URL uses the block's key in `blocksConfig`, which is what the endpoint looks up.
The protocol comes from the `X-Forwarded-Proto` header, when a proxy sets it, and the host from the request.

`kind` tells how the item is stored in the page document:

`element`
:   A native element of the document, stored as a node whose `type` is the item's ID, for example `{ "type": "h2", "children": [...] }`.

`block`
:   A Plone block, stored as a `ploneBlock` node whose `@type` is the item's ID, with the block's data next to it.

```json
{
  "@id": "http://localhost:3000/@blocks-schema",
  "document": "A page stores all its content in one block, `__somersault__`...",
  "items": [
    {
      "@id": "http://localhost:3000/@blocks-schema/p",
      "id": "p",
      "title": "Paragraph",
      "kind": "element",
      "description": "A paragraph of text, the most common node of a page..."
    },
    {
      "@id": "http://localhost:3000/@blocks-schema/teaser",
      "id": "teaser",
      "title": "Teaser",
      "kind": "block",
      "description": "Shows a card that links to one content item, with its title, description and image..."
    },
    {
      "@id": "http://localhost:3000/@blocks-schema/listing",
      "id": "listing",
      "title": "Listing",
      "kind": "block",
      "description": "Shows a list of content items that match a catalog query...",
      "restricted": "context"
    }
  ],
  "items_total": 3
}
```

`restricted` tells whether editors can add a block.
It is `true` when the block is never offered, and `"context"` when that depends on the content, because its `restricted` setting is a function.

`document` has no `@id`, because no URL returns it on its own.

## Get one block

```http
GET /@blocks-schema/teaser HTTP/1.1
```

This returns the block's documentation, schema, and variations.
`docs` is the block's documentation, with its placeholders filled in, and a variation with its own documentation has `docs` too.

```json
{
  "@id": "http://localhost:3000/@blocks-schema/teaser",
  "id": "teaser",
  "title": "Teaser",
  "docs": "Shows a card that links to one content item...",
  "schema": {
    "title": "Teaser",
    "fieldsets": ["..."],
    "properties": {"...": "..."},
    "required": ["href"]
  }
}
```

`schema` is resolved with the selected variation's `schemaEnhancer`, or the default variation's, and then the block's own `schemaEnhancer`.
Each variation is returned as `{ id, title, isDefault, schema, docs? }`, with the schema resolved for that variation.
Variations have no `@id`.
The schemas only contain values that can be represented in JSON, so widget components, React elements, and functions are left out.

When a block has no `blockSchema`, `schema` is `null`.
When the schema of a block or of a variation can't be resolved, its `schema` is `null` and it has an `error`.
The rest of the response is not affected.

An element returns its `@id`, `id`, `title`, `kind`, and `docs`, without a schema.
When a block and an element have the same ID, the block is returned.

An unknown ID returns `404 Not Found`.

## Markdown

The endpoint also returns Markdown when the `Accept` header asks for `text/markdown` and not for `application/json`.
JSON is the default.
The query string doesn't change the format.

The list returns the document format, then one line per element and per block, with a link to its details, its ID, and its summary.
A line notes when a block is not offered in the block chooser, or when that depends on the content.

```markdown
- [Teaser](http://localhost:3000/@blocks-schema/teaser) (`teaser`): Shows a card that links to one content item...
- [Listing](http://localhost:3000/@blocks-schema/listing) (`listing`): Shows a list of content items... _Offered depending on the content._
```

One element or block returns a section that says how the item is stored, and contains its documentation and, for a block, its variations and its schema in a `json` code block.
A variation's schema is only included when it differs from the block's.

## Caching

All responses are private, because they need authentication.
The client can reuse them for five minutes.
Responses vary on the `Accept`, `Accept-Language`, `Authorization`, and `Cookie` headers.

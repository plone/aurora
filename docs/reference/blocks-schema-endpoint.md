---
myst:
  html_meta:
    "description": "Reference of the @blocks-schema endpoint of Plone Aurora, which returns the documentation, schemas, and variations of a site's blocks"
    "property=og:description": "Reference of the @blocks-schema endpoint of Plone Aurora, which returns the documentation, schemas, and variations of a site's blocks"
    "property=og:title": "The @blocks-schema endpoint"
    "keywords": "Plone Aurora, blocks, schema, endpoint, Markdown, agents, MCP"
---

# The `@blocks-schema` endpoint

The `@blocks-schema` endpoint describes the blocks registered on a site.
For each block, it returns its documentation, the schema of its data, and its variations.
It also returns the format of the page document that holds the blocks.
To learn how to write the documentation that it returns, see {doc}`../how-to-guides/document-blocks`.

The endpoint has the same URLs and responses as the one of the Volto server, so clients such as the Plone MCP server work with both.

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

This returns the ID, title, and summary of every registered block, and the documentation of the page document format in `document`.
The summary is the first paragraph of the block's documentation.

```json
{
  "@id": "/@blocks-schema",
  "document": "A page stores all its content in one block, `__somersault__`...",
  "items": [
    {
      "id": "teaser",
      "title": "Teaser",
      "description": "Shows a card that links to one content item, with its title, description and image..."
    },
    {
      "id": "listing",
      "title": "Listing",
      "description": "Shows a list of content items that match a catalog query...",
      "restricted": "context"
    }
  ],
  "items_total": 2
}
```

`restricted` tells whether editors can add the block.
It is `true` when the block is never offered, and `"context"` when that depends on the content.
See [Blocks for a content item](#blocks-for-a-content-item).

Add `?full=1` to get the full details of every block, as described in the next section.

## Get one block

```http
GET /@blocks-schema/teaser HTTP/1.1
```

This returns the block's documentation, schema, and variations.
`docs` is the block's documentation, with its placeholders filled in, and a variation with its own documentation has `docs` too.

```json
{
  "@id": "/@blocks-schema/teaser",
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
The schemas only contain values that can be represented in JSON, so widget components, React elements, and functions are left out.

When a block has no `blockSchema`, `schema` is `null`.
When the schema of a block or of a variation can't be resolved, its `schema` is `null` and it has an `error`.
The rest of the response is not affected.

An unknown block ID returns `404 Not Found`.

## Markdown

The endpoint also returns Markdown, either with `?format=md` or with an `Accept` header that asks for `text/markdown` and not for `application/json`.
JSON is the default.

The list returns a single document with the document format and a section for every block.
Each section contains the block's documentation, its variations, and its schema in a `json` code block.
A variation's schema is only included when it differs from the block's.

## Blocks for a content item

Add the path of a content item in front of the endpoint to get only the blocks offered when editing that item.

```http
GET /news/@blocks-schema HTTP/1.1
```

The endpoint gets the content item with the `navroot` expander, using the token of the request, and evaluates each block's `restricted` setting with its `properties`, `navRoot`, `contentType`, and the `user`.
If `restricted` throws an error, the block is treated as restricted.
If the Plone REST API returns `401 Unauthorized`, `403 Forbidden`, or `404 Not Found` for the content item, the endpoint returns the same status.

With a path, the endpoint returns one block with a `restricted` value of `true` or `false` for that content item.

```http
GET /news/@blocks-schema/listing HTTP/1.1
```

React Router can't match a route below a content path, so these URLs are answered by the `contentResource` utility named `@blocks-schema`, which the root middleware calls before it fetches the content.
See {ref}`content-resources`.

## Caching

All responses are private, because they need authentication.
Responses without a path can be reused by the client for five minutes.
Responses for a content item are not reused.
Responses vary on the `Accept`, `Accept-Language`, `Authorization`, and `Cookie` headers.

---
myst:
  html_meta:
    "description": "How to customize the public search route in Plone Aurora"
    "property=og:description": "How to customize the public search route in Plone Aurora"
    "property=og:title": "Customize the search"
    "keywords": "Plone Aurora, frontend, Plone, search, customize, sorting, page size, query"
---

# Customize the search

This guide shows you how to customize the public search route in Plone Aurora.
Refer to {doc}`/conceptual-guides/search` for how the route works.

## Change the number of results per page

Adjust the `PAGE_SIZE` constant in the route's `loader` in {file}`packages/publicui/routes/search.tsx`.

```{code-block} ts
:caption: packages/publicui/routes/search.tsx

const PAGE_SIZE = 25;
```

The pagination derives the page count from this value, so no other change is needed.

## Add a sort option

The sort options live in {file}`packages/publicui/components/SearchResults/SearchSort.tsx`.

1.  Add the option to the `SORT_OPTIONS` array.
2.  Add a `case` for it in `sortToQuery` that returns the backend `sort_on` and `sort_order` fields.
3.  Add the matching label under `publicui.search.sort` in each locale file in {file}`packages/publicui/locales/`.

For example, to sort by creation date, add `'created'` to `SORT_OPTIONS`, and add the following `case` to `sortToQuery`.

```{code-block} ts
:caption: new case to add in sortToQuery

case 'created':
  return { sort_on: 'created', sort_order: 'descending' };
```

## Extend the query

Extend the search by adding fields to the `query` object that the route's `loader` passes to `cli.search` in {file}`packages/publicui/routes/search.tsx`.
Read any extra query parameter you add to the address through `url.searchParams` in the `loader`.
`SearchSort` and `SearchPagination` keep the other parameters when they navigate, so your parameter survives sorting and paging.
A new search from `SearchForm` only carries `path` and `sort`, so add a hidden field to it if your parameter should survive a new search term.

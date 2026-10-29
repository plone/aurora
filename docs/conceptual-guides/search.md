---
myst:
  html_meta:
    "description": "How the public search route in Plone Aurora works"
    "property=og:description": "How the public search route in Plone Aurora works"
    "property=og:title": "Search"
    "keywords": "Plone Aurora, frontend, Plone, search, pagination, sorting, accessibility, @search"
---

# Search

This guide describes the public search route in Plone Aurora.
To customize or extend the search, refer to {doc}`/how-to-guides/customize-the-search`.

Plone Aurora ships a public search route at {file}`packages/publicui/routes/search.tsx`.
The site header has a search field, and the search page repeats it above the results, so you can refine the term in place.
This route reads the search term from the `SearchableText` query parameter.

The route answers at `/search`.
An optional `path` query parameter scopes the results to a subtree.
On a multilingual site, the header search widget sends the current language root, so a search from a page under `/de` requests `/search?path=/de` and only returns matches from the `/de` language tree.

The route queries the backend in its `loader` and renders on the server.
It returns search results with sorting and pagination.
The results are friendly to accessibility tools, keyboard navigation, search engine indexers, web crawlers, and AI agents.

The route stays thin.
It delegates rendering to reusable components in the {file}`@plone/layout/components/SearchResults/` directory, including `SearchForm`, `SearchResults`, `SearchSort`, and `SearchPagination`.
The components live in `@plone/layout`, so both the CMS UI and the Public UI can reuse and theme them.

## The query

The `loader` reads the search term from the `SearchableText` query parameter, the requested page from `b_start`, the sort order from `sort`, and the scope from `path`.
It rounds `b_start` down to a multiple of the page size, so pages never overlap.
When `path` is set, it adds a `path` query, so the backend only returns matches from that subtree.
It then queries the `@search` endpoint through {program}`@plone/client` for one page of results.

```{code-block} ts
:caption: packages/publicui/routes/search.tsx

let results;
try {
  results = await cli.search({
    query: {
      // An empty SearchableText with use_site_search_settings returns a bare
      // list instead of a batch, so omit it to search everything.
      ...(query ? { SearchableText: `${query}*` } : {}),
      use_site_search_settings: 1,
      ...(root ? { path: { query: root } } : {}),
      b_start: bStart,
      b_size: PAGE_SIZE,
      ...sortToQuery(url.searchParams.get('sort')),
    },
  });
} catch (error: any) {
  throw data('Search failed', {
    status: typeof error.status === 'number' ? error.status : 500,
  });
}
```

The loader appends a trailing `*` to the term so partial words match.
`b_size` limits the request to one page, `b_start` selects the offset of the current page, and the backend returns the matching slice in `items` and the full match count in `items_total`.
That count is everything the pagination needs.

A backend failure becomes an error response that the route's error boundary renders.

`use_site_search_settings: 1` makes the backend honor the site's search settings, such as content types excluded from search, matching Volto's behavior.
An empty term combined with `use_site_search_settings` makes the backend return a bare list instead of a batched result.
So when the trimmed term is empty, the loader omits `SearchableText` from the query, and the search lists all content, still batched, sorted, and scoped.

## Result links stay in the app

The result titles link to `item['@id']`, and the loader flattens the items to app-relative addresses on the server before it returns them.

```{code-block} ts
:caption: packages/publicui/routes/search.tsx

return {
  search: flattenToAppURL(results.data.items ?? []),
  total,
  params: query,
  bStart,
  bSize: PAGE_SIZE,
};
```

`flattenToAppURL` rewrites backend addresses, for example, `http://backend/Plone/page`, to app-relative ones, such as `/page`, based on `config.settings.apiPath`, and that setting is only reliable on the server.
Flattening inside a component would set a correct `href` in the server-rendered markup, but leave the raw backend address in the data that react-aria navigates with on the client, so a click would open the backend.
Flattening once in the `loader` means the serialized result data is already app-relative, so the markup and the client navigation use the same in-app address.
The sitemap route follows the same approach.

## The page layout

The search page stacks its parts in a single column.

1.  The heading and the `SearchForm` field.
    The form submits to the current route and carries the `path` scope and the `sort` order as hidden fields, so a new term keeps them, while it starts again from the first page.
2.  A results bar, with the result count on the left and the `SearchSort` selector on the right.
    When the results span several pages, the count also shows the range on the current page.
    On narrow screens, the two stack.
3.  The results, or an empty state when nothing matches.
4.  The centered `SearchPagination` controls.

Each result shows its content type label and its effective date, the linked title, and the description.
The type label comes from `type_title`, which the site search settings include in the default metadata.
`SearchResults` highlights the search terms in the title and the description with `<mark>`, matching them at the start of words, as the backend does with the trailing `*`.

## Sorting

The `SearchSort` component stores the choice in a single `sort` query parameter and resets paging to the first page whenever the order changes.
`relevance` is the default, which the component omits from the address.

The `loader` translates the parameter into the backend `sort_on` and `sort_order` fields with the `sortToQuery` helper, so the route stays the single source of truth for the query.

```{code-block} ts
:caption: packages/layout/components/SearchResults/SearchSort.tsx

export function sortToQuery(sort: string | null): {
  sort_on?: string;
  sort_order?: 'ascending' | 'descending';
} {
  switch (sort) {
    case 'date':
      return { sort_on: 'effective', sort_order: 'descending' };
    case 'title':
      return { sort_on: 'sortable_title', sort_order: 'ascending' };
    default:
      return {};
  }
}
```

## Pagination

The `SearchPagination` component turns `total`, `bStart`, and `bSize` into the current page and the total page count.
It renders the `Pagination` component from the registry, which `@plone/layout` registers from `@plone/components`, so an add-on can replace it with `config.registerComponent`.
`Pagination` shows the first and last page, two pages on each side of the current one with an ellipsis for each gap, and previous and next controls.
When the results fit on a single page, it renders nothing.

`SearchPagination` passes a `getPageHref` function, so `Pagination` renders real links instead of buttons.
The links work without JavaScript, and crawlers and agents can follow them.
Each page is a link that updates the `b_start` query parameter and keeps every other parameter in the address, such as `SearchableText`, `sort`, and `path`.
The component reads the current parameters with `useSearchParams` and the current path with `useLocation`, so it carries any additional parameters across pages.

When the address requests a `b_start` beyond the last page, the loader redirects to the last real page instead of rendering an empty result list.

## Accessibility and the loading state

The search markup carries the structure that assistive technology needs.

- `SearchForm` is a `search` landmark, and its field has a visually hidden label.
- `SearchResults` renders the results in a named `region` landmark, a `<section>` with an `aria-label`.
  Individual results are `<article>` elements, which aren't landmarks.
- The result count is a `<p>` with `role="status"`, a polite live region, so screen readers announce the new count.
- The result title links, the sort selector, and the pagination links all show a visible `:focus-visible` outline for keyboard navigation.
- The pagination is a `nav` landmark with labeled previous and next controls, and the current page carries `aria-current="page"`.

While the loader re-runs for a new query, sort order, or page, the route detects the navigation with `useNavigation` and passes `loading` to `SearchResults`.
`SearchResults` then sets `aria-busy` on the region, swaps the count for a {guilabel}`Searching…` status, and dims the list.

The Public UI also sets `scrollbar-gutter: stable` on `html` in {file}`packages/publicui/styles/publicui.css`.
This keeps the page width steady when a change in the number of results shows or hides a scroll bar.

---
myst:
  html_meta:
    "description": "How the public search route in Plone Aurora works"
    "property=og:description": "How the public search route in Plone Aurora works"
    "property=og:title": "Search"
    "keywords": "Plone Aurora, frontend, Plone, search, pagination, sorting, facets, tags, accessibility, @search"
---

# Search

This guide describes the public search route in Plone Aurora.
To customize or extend the search, refer to {doc}`/how-to-guides/customize-the-search`.

Plone Aurora ships a public search route at {file}`packages/publicui/routes/search.tsx`.
The search input itself lives in the site header.
This route reads the search term from the `SearchableText` query parameter.

The route answers at `/search` for the whole site, and at `/<root>/search` for a top-level folder, such as a language root folder.
On a multilingual site, `/de/search` scopes the results to the `/de` language tree.

The route queries the backend in its `loader` and renders on the server.
It returns search results with sorting, filtering, and pagination.
The results are friendly to accessibility tools, keyboard navigation, search engine indexers, web crawlers, and AI agents.

The route stays thin.
It delegates rendering to reusable components in the {file}`@plone/layout/components/SearchResults/` directory, including `SearchResults`, `SearchSort`, `SearchFacets`, and `SearchPagination`.
The components live in `@plone/layout`, so both the CMS UI and the Public UI can reuse and theme them.

## The query

The `loader` reads the search term from the `SearchableText` query parameter, the requested page from `b_start`, the selected tags from repeated `Subject` parameters, and the sort order from `sort`.
On the scoped route, it adds a `path` query for the root segment, so the backend only returns matches from that subtree.
It then runs two queries against the `@search` endpoint through `@plone/client` in parallel.

```{code-block} ts
:caption: packages/publicui/routes/search.tsx

const baseQuery = {
  SearchableText: `${query}*`,
  use_site_search_settings: 1,
  ...(root ? { path: { query: root } } : {}),
};

let results;
let facetSample;
try {
  [results, facetSample] = await Promise.all([
    cli.search({
      query: {
        ...baseQuery,
        ...(subjects.length > 0 ? { Subject: subjects } : {}),
        b_start: bStart,
        b_size: PAGE_SIZE,
        ...sortToQuery(url.searchParams.get('sort')),
      },
    }),
    cli.search({
      query: {
        ...baseQuery,
        metadata_fields: 'Subject',
        b_size: FACET_SAMPLE_SIZE,
      },
    }),
  ]);
} catch (error: any) {
  throw data('Search failed', {
    status: typeof error.status === 'number' ? error.status : 500,
  });
}
```

The first query fetches the visible page of results.
The loader appends a trailing `*` to the term so partial words match.
`b_size` limits the request to one page, `b_start` selects the offset of the current page, and the backend returns the matching slice in `items` and the full match count in `items_total`.
That count is everything the pagination needs.

The second query feeds {ref}`the tag facets <search-facet-sampling>`.
A backend failure becomes an error response that the route's error boundary renders.

`use_site_search_settings: 1` makes the backend honor the site's search settings, such as content types excluded from search, matching Volto's behavior.
This flag is also the reason the loader trims the term, returns early, and renders only the heading when there is no `SearchableText`.
An empty term combined with `use_site_search_settings` makes the backend return a bare list instead of a batched result.

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
  facets: aggregateFacets(facetSample.data.items ?? []),
};
```

`flattenToAppURL` rewrites backend addresses, for example, `http://backend/Plone/page`, to app-relative ones, such as `/page`, based on `config.settings.apiPath`, and that setting is only reliable on the server.
Flattening inside a component would set a correct `href` in the server-rendered markup, but leave the raw backend address in the data that react-aria navigates with on the client, so a click would open the backend.
Flattening once in the `loader` means the serialized result data is already app-relative, so the markup and the client navigation use the same in-app address.
The sitemap route follows the same approach.

## Content-type icons

Each result shows an icon for its content type.
`getContentIcon` from `@plone/helpers` resolves the icon from the result's `@type` by looking up the `config.settings.contentIcons` map, and `SearchResults` falls back to the page icon.

`@plone/layout` registers the `contentIcons` map in {file}`packages/layout/config/settings.ts`, so both the CMS UI and the Public UI resolve the same icons.
The `@plone/contents` package also registers the map, but that package only installs in the CMS UI.

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

The `SearchPagination` component turns `total`, `bStart`, and `bSize` into numbered page links.
It computes the current page and the total page count, shows the first and last page with an ellipsis around the current page, and renders previous and next controls.
When the results fit on a single page, the component renders nothing.

Each page is a link that updates the `b_start` query parameter and keeps every other parameter in the address, such as `SearchableText`, `sort`, and `Subject`.
The component reads the current parameters with `useSearchParams` and the current path with `useLocation`, so it carries any additional filters across pages.

When the address requests a `b_start` beyond the last page, the loader redirects to the last real page instead of rendering an empty result list.

(search-facet-sampling)=

## Tag facets

The `SearchFacets` component renders a checkbox, styled as a pill, per `Subject` (tag) with a result count.
The component stores selected tags as repeated `Subject` query parameters, and toggling one resets paging to the first page.
Multiple selected tags match results that carry any of them, because `@plone/client` serializes the array as Plone's `Subject:list` query.

The tag list stays collapsed by default behind a {guilabel}`Filter by tag` disclosure button.
It opens automatically when the address already carries an active `Subject` filter, so a shared, pre-filtered link still shows its active tags.
The component animates the expand and collapse with the `grid-template-rows` technique, from `0fr` to `1fr`, and honors `prefers-reduced-motion`.

The available tags can't come from the `plone.app.vocabularies.Keywords` vocabulary, because that vocabulary requires authentication and the public search is anonymous.
Instead, the `loader` runs the second, unfiltered `@search` query shown above, which requests `metadata_fields=Subject`, and the `aggregateFacets` helper counts the `Subject` values of those matches.
The loader computes this facet sample without the active `Subject` filter, so every tag stays visible with its full count even after you select one.

```{important}
The loader caps the facet sample at `FACET_SAMPLE_SIZE` matches per request, so the tag counts reflect the first `FACET_SAMPLE_SIZE` matches rather than every match.
```

## Accessibility and the loading state

The search markup carries the structure that assistive technology needs.

-   `SearchResults` renders the results in a named `region` landmark, a `<section>` with an `aria-label`.
    Individual results are `<article>` elements, which aren't landmarks.
-   The result count is a `<p>` with `role="status"`, a polite live region, so screen readers announce the new count.
-   The result title links, the tag chips, the {guilabel}`Filter by tag` toggle, the sort selector, and the pagination links all show a visible `:focus-visible` outline for keyboard navigation.
-   The pagination is a `nav` landmark with labeled previous and next controls, and the current page carries `aria-current="page"`.

While the loader re-runs for a new query, sort order, page, or filter, the route detects the navigation with `useNavigation` and passes `loading` to `SearchResults`.
`SearchResults` then sets `aria-busy` on the region, swaps the count for a {guilabel}`Searching…` status, and dims the list.

The Public UI also sets `scrollbar-gutter: stable` on `html` in {file}`packages/publicui/styles/publicui.css`.
This keeps the page width steady when expanding the tag filter or changing the result count shows or hides a scroll bar.

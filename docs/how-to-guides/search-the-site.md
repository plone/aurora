---
myst:
  html_meta:
    "description": "How to use and customize the site search in Plone Aurora"
    "property=og:description": "How to use and customize the site search in Plone Aurora"
    "property=og:title": "Search the site"
    "keywords": "Plone Aurora, frontend, Plone, search, pagination, sorting, facets, tags, content-type icons, accessibility, @search"
---

# Search the site

This guide shows you how the public search route in Plone Aurora works and how to extend it.

Plone Aurora ships a public search route at {file}`packages/publicui/routes/search.tsx`.
It renders a list of clickable results with a per-content-type icon, a localized result count, sorting, a collapsible tag filter, and pagination.

The search input itself lives in the site header (see issue #59, `[Aurora Slots] - Header`), so this route reads the search term from the `SearchableText` query parameter.
The route renders on the server: it queries the backend in its `loader`, so results, sorting, filtering, and pagination all work without client-side JavaScript and stay friendly to search engine crawlers.

The route stays thin.
It delegates rendering to reusable components in `@plone/layout/components/SearchResults/`: `SearchResults`, `SearchSort`, `SearchFacets`, and `SearchPagination`.

## How the route works

The `loader` reads the search term from the `SearchableText` query parameter and the requested page from the `b_start` query parameter, then calls the `@search` endpoint through `@plone/client`.

```{code-block} ts
:caption: packages/publicui/routes/search.tsx
const PAGE_SIZE = 25;

export async function loader({ request, params, context }) {
  const cli = context.get(ploneClientContext);

  const path = `/${params['*'] || ''}`;
  const url = new URL(request.url);
  const query = url.searchParams.get('SearchableText') || '';
  const bStart = Math.max(0, Number(url.searchParams.get('b_start')) || 0);

  const results = await cli.search({
    query: {
      SearchableText: query ? `${query}*` : '',
      path: { query: path || '/' },
      b_start: bStart,
      b_size: PAGE_SIZE,
    },
  });

  return {
    search: results.data.items,
    total: results.data.items_total,
    params: query,
    bStart,
    bSize: PAGE_SIZE,
  };
}
```

The loader appends a trailing `*` to the term so partial words match.
`b_size` limits each request to one page of results, and `b_start` selects the offset of the current page.
The backend returns the matching slice in `items` and the full match count in `items_total`, which is everything the page needs to paginate.

```{note}
The `path` comes from the catch-all route segment.
So `/search` searches the whole site, and `/some/folder/search` scopes the search to that subtree.
```

The real loader also passes `use_site_search_settings: 1`, so the backend honors the site's search settings (for example, content types excluded from search), matching Volto.
It also returns early and renders only the form when there is no `SearchableText`, because an empty term combined with `use_site_search_settings` makes the backend return a bare list instead of a batched result.

## Render the results

The `SearchResults` component renders the results.
It lives in `@plone/layout`, so both the CMS UI and the Public UI can reuse and theme it.
Each result shows a content-type icon, a title that links to the item, the description, and the localized effective date.

```{code-block} tsx
:caption: packages/layout/components/SearchResults/SearchResults.tsx
<h2 className={styles.headline}>
  <Link href={item['@id']}>{item.title}</Link>
</h2>
```

### Keep result links inside Aurora

Link the title to `item['@id']` **directly**, not to `flattenToAppURL(item['@id'])`.

`flattenToAppURL` rewrites backend addresses (for example, `http://backend/Plone/page`) to app-relative ones (`/page`) from `config.settings.apiPath`, but that setting is only reliable on the server.
Flattening inside the component sets a correct `href` in the server-rendered markup.
It still leaves the raw backend address in the data that react-aria navigates with on the client, so a click opens the backend.

Flatten the items **once, in the `loader`**, on the server, the same way the sitemap route does.
The serialized result data is then already app-relative, so the markup and the client navigation use the same in-app address.

```{code-block} ts
:caption: packages/publicui/routes/search.tsx
import { flattenToAppURL } from '@plone/helpers';

return {
  search: flattenToAppURL(results.data.items ?? []),
  // other return fields
};
```

## Give each content type its own icon

`getContentIcon` from `@plone/helpers` resolves each result's icon from its `@type` by looking up `config.settings.contentIcons`, and falls back to the page icon.

```{code-block} tsx
:caption: packages/layout/components/SearchResults/SearchResults.tsx
const Icon = getContentIcon(item['@type']) ?? PageIcon;

// in the result markup:
<span className={styles.icon}><Icon /></span>
```

`@plone/layout` registers the `contentIcons` map in its settings, so both the CMS UI and the Public UI resolve the same icons.
The `@plone/contents` package also registers it, but only installs in the CMS UI.

```{code-block} ts
:caption: packages/layout/config/settings.ts
import pageSVG from '@plone/components/icons/page.svg?react';
import folderSVG from '@plone/components/icons/folder.svg?react';

config.settings.contentIcons = {
  Document: pageSVG,
  Folder: folderSVG,
  'News Item': newsSVG,
  Event: calendarSVG,
  Image: imageSVG,
  File: pageSVG,
  Link: linkSVG,
};
```

To give a content type its own icon, add an entry to this map.

## Paginate the results

The `SearchPagination` component, also in `@plone/layout`, turns `total`, `bStart`, and `bSize` into numbered page links.
It computes the current page and the total page count, shows the first and last page with an ellipsis around the current page, and renders previous and next controls.

Each page is a `<Link>` that updates the `b_start` query parameter and keeps every other parameter in the address, such as `SearchableText`.
The component reads the current parameters with `useSearchParams` and the current path with `useLocation`, so it carries any filters you add later across pages.

```{code-block} tsx
:caption: packages/layout/components/SearchResults/SearchPagination.tsx
const linkTo = (page: number) => {
  const next = new URLSearchParams(searchParams);
  if (page <= 0) {
    next.delete('b_start');
  } else {
    next.set('b_start', String(page * bSize));
  }
  const search = next.toString();
  return search ? `${pathname}?${search}` : pathname;
};
```

When the results fit on a single page, the component renders nothing.

To change how many results appear per page, adjust the `PAGE_SIZE` constant in the route's `loader`.

## Add or change a sort option

The `SearchSort` component renders a sort selector.
It stores the choice in a single `sort` query parameter (`relevance`, `date`, or `title`) and resets paging to the first page whenever the order changes.
`relevance` is the default, which the route omits from the address.

The `loader` translates the parameter into the backend `sort_on` and `sort_order` fields with the `sortToQuery` helper, so the route stays the single source of truth for the query.

```{code-block} ts
:caption: packages/layout/components/SearchResults/SearchSort.tsx
export function sortToQuery(sort: string | null) {
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

To add a sort option, extend `SORT_OPTIONS` and `sortToQuery`, then add the matching label under `layout.search.sort` in each locale.

## Filter by tag

The `SearchFacets` component renders a checkbox, styled as a pill, per `Subject` (tag) with a result count.
The component stores selected tags as repeated `Subject` query parameters, and toggling one resets paging to the first page.

The tag list stays **collapsed by default** behind a "Filter by tag" disclosure button with a rotating chevron.
It opens automatically when the address already carries an active `Subject` filter, so a shared, pre-filtered link still shows its active tags.
The component animates the expand and collapse with the `grid-template-rows` technique (from `0fr` to `1fr`) and honors `prefers-reduced-motion`.

The available tags can't come from the `plone.app.vocabularies.Keywords` vocabulary, because that vocabulary requires authentication and the public search is anonymous.
Instead, the `loader` runs a second, unfiltered `@search` that requests `metadata_fields=Subject`, and `aggregateFacets` counts the `Subject` values of those matches.

```{code-block} ts
:caption: packages/publicui/routes/search.tsx
const subjects = url.searchParams.getAll('Subject');

const [results, facetSample] = await Promise.all([
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
    query: { ...baseQuery, metadata_fields: 'Subject', b_size: FACET_SAMPLE_SIZE },
  }),
]);
```

The loader computes the facet sample *without* the active `Subject` filter, so every tag stays visible with its full count even after you select one.
Multiple selected tags match results that carry **any** of them, because `@plone/client` serializes the array as Plone's `Subject:list` query.

```{important}
The loader caps the facet sample at `FACET_SAMPLE_SIZE` matches per request, so the tag counts reflect the first `FACET_SAMPLE_SIZE` matches rather than every match.
```

## Accessibility and the loading state

The route meets the accessibility requirements from the issue.

- `SearchResults` renders the results in a named `region` landmark (a `<section>` with `aria-label`); individual results are `<article>` elements, which aren't landmarks.
- The result count is a `<p>` with `role="status"` (a polite live region) and `aria-controls` that points at the results container, so screen readers announce the new count and associate it with the list it describes.
- The tag chips, the "Filter by tag" toggle, and the sort selector all show a visible `:focus-visible` outline.

While the loader re-runs for a new query, sort order, page, or filter, the route detects the navigation with `useNavigation` and passes `loading` to `SearchResults`.
`SearchResults` then sets `aria-busy` on the region, swaps the count for a "Searching…" status, and dims the list.

```{code-block} ts
:caption: packages/publicui/routes/search.tsx
const navigation = useNavigation();
const location = useLocation();
const isLoading =
  navigation.state === 'loading' &&
  navigation.location?.pathname === location.pathname;
```

The Public UI also sets `scrollbar-gutter: stable` on `html` in {file}`packages/publicui/styles/publicui.css`.
This keeps the page width steady when expanding the tag filter or changing the result count shows or hides a scroll bar.

## Customize the query

The route owns the query, so you can extend the search by adding fields to the `query` object that it passes to `cli.search`.
The `loader` exposes any extra query parameter you add to the address through `url.searchParams`, and `SearchSort`, `SearchFacets`, and `SearchPagination` all keep the other parameters when they navigate.

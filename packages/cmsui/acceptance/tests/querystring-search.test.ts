import { expect, test } from '../../../tooling/playwright/test';
import { login } from '../../../tooling/playwright/login';
import { createContent } from '../../../tooling/playwright/content';

// The Querystring widget fetches its results preview from this route. No form
// on main renders the widget yet (the Listing block schema lands with #107), so
// this exercises the route the same way the widget's fetcher does.
function querystringSearchURL(query: unknown) {
  return `/@querystringSearch?query=${encodeURIComponent(JSON.stringify(query))}`;
}

test('The querystring search route returns the matching content as JSON', async ({
  page,
}) => {
  await login(page);
  await createContent(page, {
    contentType: 'Document',
    contentId: 'querystring-target',
    contentTitle: 'Querystring target zebracorn',
  });

  const response = await page.request.get(
    querystringSearchURL([
      {
        i: 'SearchableText',
        o: 'plone.app.querystring.operation.string.contains',
        v: 'zebracorn',
      },
    ]),
  );

  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('application/json');
  const body = await response.json();
  expect(body.items_total).toBe(1);
  expect(body.items[0].title).toBe('Querystring target zebracorn');
});

test('The querystring search route returns no results for an empty query', async ({
  page,
}) => {
  await login(page);

  const response = await page.request.get(querystringSearchURL([]));

  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({ items: [], items_total: 0 });
});

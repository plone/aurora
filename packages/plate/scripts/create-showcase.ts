/**
 * Creates or updates a published page with every native block of Aurora's
 * somersault presets, for reviewing block styles on a development site.
 *
 *   pnpm --filter @plone/plate showcase
 *
 * Set `PLONE_API_PATH` (default `http://localhost:8080/Plone`), `PLONE_USER`
 * and `PLONE_PASSWORD` (default `admin`) to target another site.
 */
import { SOMERSAULT_KEY } from '../constants.ts';
import { showcaseValue } from '../acceptance/fixtures/showcase.ts';

const apiPath = process.env.PLONE_API_PATH ?? 'http://localhost:8080/Plone';
const user = process.env.PLONE_USER ?? 'admin';
const password = process.env.PLONE_PASSWORD ?? 'admin';

const id = 'plate-showcase';
const title = 'Plate showcase';

const headers = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
  Authorization: `Basic ${btoa(`${user}:${password}`)}`,
};

async function request(method: string, url: string, body?: unknown) {
  const response = await fetch(url, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok && response.status !== 404) {
    throw new Error(
      `${method} ${url} returned ${response.status} ${response.statusText}: ${await response.text()}`,
    );
  }
  return response;
}

const url = `${apiPath}/${id}`;
// Aurora only reads the somersault block; `blocks_layout` isn't used.
const content = {
  title,
  blocks: {
    [SOMERSAULT_KEY]: {
      '@type': SOMERSAULT_KEY,
      value: showcaseValue(title),
    },
  },
};

const existing = await request('GET', url);
if (existing.status === 404) {
  await request('POST', apiPath, { '@type': 'Document', id, ...content });
} else {
  await request('PATCH', url, content);
}

const { review_state } = await (await request('GET', url)).json();
if (review_state !== 'published') {
  await request('POST', `${url}/@workflow/publish`);
}

// eslint-disable-next-line no-console
console.log(`Plate showcase ready at ${url}`);

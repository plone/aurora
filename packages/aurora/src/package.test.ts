import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const packageJson = JSON.parse(
  readFileSync(path.join(import.meta.dirname, '..', 'package.json'), 'utf8'),
);

describe('package.json', () => {
  // An app imports the client entry only for its side effects
  // (`import '@plone/aurora/app/entry.client'`). With `"sideEffects": false`,
  // a production build drops that import, and the app never hydrates. The dev
  // server doesn't tree-shake, so only a production build would show it.
  it('declares the client entry and the server as side effects', () => {
    expect(packageJson.sideEffects).toEqual(
      expect.arrayContaining(['./src/app/entry.client.tsx', './server.js']),
    );
  });
});

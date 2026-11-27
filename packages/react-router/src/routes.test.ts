import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getAddonRoutesConfig } from './routes';

describe('getAddonRoutesConfig without arguments', () => {
  let appDir: string;

  beforeEach(() => {
    appDir = fs.mkdtempSync(path.join(os.tmpdir(), 'plone-app-'));
    vi.spyOn(process, 'cwd').mockReturnValue(appDir);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    fs.rmSync(appDir, { recursive: true, force: true });
  });

  it('reads the routes and add-ons generated in the app', () => {
    fs.mkdirSync(path.join(appDir, '.plone'));
    fs.writeFileSync(
      path.join(appDir, '.plone', 'registry.routes.json'),
      JSON.stringify([
        { type: 'route', path: '@@edit', file: '@plone/cmsui/routes/edit.tsx' },
      ]),
    );
    fs.writeFileSync(
      path.join(appDir, '.plone', 'registry.addonsInfo.json'),
      JSON.stringify([
        { name: '@plone/cmsui', modulePath: '/path/to/plone/cmsui' },
      ]),
    );

    expect(getAddonRoutesConfig()).toEqual([
      {
        id: '@plone/cmsui/routes/edit',
        path: '@@edit',
        file: '/path/to/plone/cmsui/routes/edit.tsx',
        children: undefined,
      },
    ]);
  });

  it('says what to run when the files are missing', () => {
    expect(() => getAddonRoutesConfig()).toThrow(/init-loaders/);
  });
});

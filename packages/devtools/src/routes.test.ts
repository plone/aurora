import { describe, expect, it } from 'vitest';
import {
  addonOf,
  buildRouteInfos,
  createRouteId,
  middlewareNames,
  routeFilesById,
  type ServerBuildRoute,
} from './routes';

const root = '/repo/apps/aurora';
const appDir = `${root}/app`;
const cmsui = '/repo/packages/cmsui';
const addons = [
  { name: '@plone/cmsui', modulePath: cmsui },
  { name: '@plone/cmsui-extra', modulePath: `${cmsui}-extra` },
];

describe('createRouteId', () => {
  it('strips the extension of the file as written', () => {
    expect(createRouteId('okroute.tsx')).toBe('okroute');
    expect(createRouteId(`${cmsui}/routes/edit.tsx`)).toBe(
      `${cmsui}/routes/edit`,
    );
  });
});

describe('routeFilesById', () => {
  it('maps explicit and derived ids, nested, plus root', () => {
    const files = routeFilesById(
      [
        { id: 'ok', file: 'okroute.tsx', path: 'ok' },
        {
          file: `${cmsui}/routes/layout.tsx`,
          children: [{ file: `${cmsui}/routes/edit.tsx`, path: '@@edit/*' }],
        },
      ],
      appDir,
    );
    expect(Object.fromEntries(files)).toEqual({
      root: `${appDir}/root.tsx`,
      ok: `${appDir}/okroute.tsx`,
      [`${cmsui}/routes/layout`]: `${cmsui}/routes/layout.tsx`,
      [`${cmsui}/routes/edit`]: `${cmsui}/routes/edit.tsx`,
    });
  });
});

describe('addonOf', () => {
  it('picks the add-on whose package contains the file, not a prefix sibling', () => {
    expect(addonOf(`${cmsui}/routes/edit.tsx`, addons)?.name).toBe(
      '@plone/cmsui',
    );
    expect(addonOf(`${cmsui}-extra/routes/x.tsx`, addons)?.name).toBe(
      '@plone/cmsui-extra',
    );
    expect(addonOf(`${appDir}/okroute.tsx`, addons)).toBeUndefined();
  });
});

const i18nMiddleware = async () => {};

describe('buildRouteInfos', () => {
  it('combines the server build, the config and the add-ons', () => {
    const routes: Record<string, ServerBuildRoute> = {
      root: {
        id: 'root',
        module: {
          loader() {},
          middleware: [async function installConfig() {}, i18nMiddleware],
        },
      },
      ok: { id: 'ok', parentId: 'root', path: 'ok', module: { loader() {} } },
      [`${cmsui}/routes/edit`]: {
        id: `${cmsui}/routes/edit`,
        parentId: 'root',
        path: '@@edit/*',
        module: { loader() {}, action() {} },
      },
    };
    const infos = buildRouteInfos({
      routes,
      config: [
        { id: 'ok', file: 'okroute.tsx', path: 'ok' },
        { file: `${cmsui}/routes/edit.tsx`, path: '@@edit/*' },
      ],
      appDir,
      root,
      addons,
    });
    expect(infos).toEqual([
      expect.objectContaining({
        id: 'root',
        addon: 'app',
        source: 'app/root.tsx',
        hasLoader: true,
        hasMiddleware: true,
        hasAction: false,
        middleware: ['installConfig', 'i18nMiddleware'],
      }),
      expect.objectContaining({
        id: 'ok',
        addon: 'app',
        file: 'app/okroute.tsx',
      }),
      expect.objectContaining({
        id: `${cmsui}/routes/edit`,
        addon: '@plone/cmsui',
        source: '@plone/cmsui/routes/edit.tsx',
        file: '../../packages/cmsui/routes/edit.tsx',
        hasLoader: true,
        hasAction: true,
        hasMiddleware: false,
        middleware: undefined,
      }),
    ]);
  });
});

describe('middlewareNames', () => {
  it('names each middleware in order, empty for anonymous ones', () => {
    const named = async () => {};
    expect(middlewareNames([named, () => {}, 'not a function'])).toEqual([
      'named',
      '',
      '',
    ]);
  });

  it('is undefined for a route without middleware', () => {
    expect(middlewareNames(undefined)).toBeUndefined();
  });
});

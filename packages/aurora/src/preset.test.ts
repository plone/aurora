import { describe, expect, it, vi } from 'vitest';
import { initPloneRegistryLoaders } from '@plone/registry/init-loaders';
import { ploneAurora } from './preset';

vi.mock('@plone/registry/init-loaders', () => ({
  initPloneRegistryLoaders: vi.fn(async () => ({})),
}));

describe('ploneAurora', () => {
  it('is a named React Router preset', () => {
    expect(ploneAurora().name).toBe('@plone/aurora');
  });

  it('generates the registry files before React Router reads the routes', async () => {
    const config = await ploneAurora().reactRouterConfig!({
      reactRouterUserConfig: {},
    });

    expect(initPloneRegistryLoaders).toHaveBeenCalledOnce();
    expect(config).toEqual({});
  });
});

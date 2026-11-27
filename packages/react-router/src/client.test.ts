import { afterEach, describe, expect, it } from 'vitest';
import config from '@plone/registry';
import PloneClient from '@plone/client';
import { getPloneClientClass } from './client';

describe('getPloneClientClass', () => {
  afterEach(() => {
    config.utilities.clientEndpoints = {};
  });

  it('returns the ploneClient utility when there are no clientEndpoints', () => {
    config.registerUtility({
      name: 'ploneClient',
      type: 'client',
      method: () => PloneClient,
    });

    expect(getPloneClientClass()).toBe(PloneClient);
  });

  it('adds the methods of every clientEndpoints utility', () => {
    config.registerUtility({
      name: 'ploneClient',
      type: 'client',
      method: () => PloneClient,
    });
    config.registerUtility({
      name: 'first-addon',
      type: 'clientEndpoints',
      method: () => ({
        getApiPath(this: PloneClient) {
          return this.config.apiPath;
        },
      }),
    });
    config.registerUtility({
      name: 'second-addon',
      type: 'clientEndpoints',
      method: () => ({ getAnswer: () => 42 }),
    });

    const cli = getPloneClientClass().initialize({
      apiPath: 'http://localhost:8080/Plone',
    }) as PloneClient & Record<string, () => unknown>;

    expect(cli).toBeInstanceOf(PloneClient);
    expect(cli.getApiPath()).toBe('http://localhost:8080/Plone');
    expect(cli.getAnswer()).toBe(42);
    expect(cli.getContent).toBeTypeOf('function');
  });

  it('extends a custom ploneClient utility', () => {
    class CustomClient extends PloneClient {}
    config.registerUtility({
      name: 'ploneClient',
      type: 'client',
      method: () => CustomClient,
    });
    config.registerUtility({
      name: 'addon',
      type: 'clientEndpoints',
      method: () => ({ getAnswer: () => 42 }),
    });

    const cli = getPloneClientClass().initialize({ apiPath: '' });

    expect(cli).toBeInstanceOf(CustomClient);
    expect(cli).toHaveProperty('getAnswer');
  });
});

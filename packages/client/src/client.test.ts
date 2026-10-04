import {
  describe,
  vi,
  type Mock,
  beforeEach,
  afterEach,
  it,
  expect,
} from 'vitest';
import axios from 'axios';
import PloneClient, { apiRequest, type RequestResponse } from './index';

vi.mock('axios');

const config = { apiPath: 'http://localhost:8080/Plone', token: 'secret' };

async function getIdentityProviders(
  this: PloneClient,
): Promise<RequestResponse<{ options: string[] }>> {
  return apiRequest('get', '/@login', { config: this.config });
}

describe('PloneClient.initialize', () => {
  it('returns an instance of the class it is called on', () => {
    class CustomClient extends PloneClient {}

    const cli = CustomClient.initialize(config);

    expect(cli).toBeInstanceOf(CustomClient);
    expect(cli.config).toStrictEqual(config);
  });

  it('applies the default config', () => {
    const cli = PloneClient.initialize({} as any);

    expect(cli.config.apiPath).toBe('http://localhost:8080/Plone');
  });
});

// The endpoint types declare `this: PloneClient`, so TypeScript still rejects
// detached calls even though the methods are bound at runtime.
const detach = <F extends (...args: any[]) => any>(fn: F) =>
  fn as OmitThisParameter<F>;

describe('PloneClient method binding', () => {
  let mockAxios: any;

  beforeEach(() => {
    mockAxios = {
      interceptors: { response: { use: vi.fn() } },
      request: vi.fn().mockResolvedValue({ status: 200, data: {} }),
    };
    (axios.create as Mock).mockImplementation(() => mockAxios);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('binds core methods to the instance', async () => {
    const getBreadcrumbs = detach(
      PloneClient.initialize(config).getBreadcrumbs,
    );

    await getBreadcrumbs({ path: '/news' });

    expect(mockAxios.request).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'http://localhost:8080/Plone/++api++/news/@breadcrumbs',
      }),
    );
  });

  it('binds extension methods to the instance', async () => {
    const getProviders = detach(
      PloneClient.extend({ getIdentityProviders }).initialize(config)
        .getIdentityProviders,
    );

    await getProviders();

    expect(mockAxios.request).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'http://localhost:8080/Plone/++api++/@login',
      }),
    );
  });

  it('binds each method to its own instance', () => {
    const ExtendedClient = PloneClient.extend({
      getApiPath(this: PloneClient) {
        return this.config.apiPath;
      },
    });
    const first = ExtendedClient.initialize({ apiPath: 'first' });
    const second = ExtendedClient.initialize({ apiPath: 'second' });

    const getApiPath = detach(first.getApiPath);

    expect(getApiPath()).toBe('first');
    expect(second.getApiPath()).toBe('second');
  });
});

describe('PloneClient.extend', () => {
  let mockAxios: any;

  beforeEach(() => {
    mockAxios = {
      interceptors: { response: { use: vi.fn() } },
      request: vi.fn().mockResolvedValue({ status: 200, data: {} }),
    };
    (axios.create as Mock).mockImplementation(() => mockAxios);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('adds the given methods to the instances', async () => {
    const ExtendedClient = PloneClient.extend({ getIdentityProviders });
    const cli = ExtendedClient.initialize(config);

    await cli.getIdentityProviders();

    expect(mockAxios.request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'get',
        url: 'http://localhost:8080/Plone/++api++/@login',
        headers: expect.objectContaining({ Authorization: 'Bearer secret' }),
      }),
    );
  });

  it('keeps the core methods and the config', () => {
    const cli = PloneClient.extend({ getIdentityProviders }).initialize(config);

    expect(cli).toBeInstanceOf(PloneClient);
    expect(cli.config).toStrictEqual(config);
    expect(cli.getContent).toBeTypeOf('function');
  });

  it('calls the methods with the client as `this`', () => {
    const cli = PloneClient.extend({
      getApiPath(this: PloneClient) {
        return this.config.apiPath;
      },
      getApiPathTwice(this: PloneClient & { getApiPath: () => string }) {
        return `${this.getApiPath()}${this.getApiPath()}`;
      },
    }).initialize({ apiPath: 'a' });

    expect(cli.getApiPath()).toBe('a');
    expect(cli.getApiPathTwice()).toBe('aa');
  });

  it('chains, keeping the methods of every extension', () => {
    const cli = PloneClient.extend({ first: () => 1 })
      .extend({ second: () => 2 })
      .initialize(config);

    expect(cli.first()).toBe(1);
    expect(cli.second()).toBe(2);
  });

  it('lets a later extension replace a method', () => {
    const cli = PloneClient.extend({ value: () => 'first' })
      .extend({ value: () => 'second' })
      .initialize(config);

    expect(cli.value()).toBe('second');
  });

  it('lets an extension replace a core method', async () => {
    const getContent = vi.fn().mockResolvedValue({ status: 200, data: {} });
    const cli = PloneClient.extend({ getContent }).initialize(config);

    await cli.getContent({ path: '/' });

    expect(getContent).toHaveBeenCalledWith({ path: '/' });
    expect(mockAxios.request).not.toHaveBeenCalled();
  });

  it('does not modify the class it is called on', () => {
    PloneClient.extend({ getIdentityProviders });

    const cli = PloneClient.initialize(config);

    expect(cli).not.toHaveProperty('getIdentityProviders');
  });
});

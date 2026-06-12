import {
  describe,
  vi,
  type Mock,
  beforeEach,
  afterEach,
  it,
  expect,
} from 'vitest';
import axios, { type AxiosRequestConfig } from 'axios';
import { apiRequest, axiosConfigAdapter, getBackendURL } from './api';

vi.mock('axios');

describe('apiRequest', () => {
  let mockAxios: any;

  const config = {
    apiPath: '/',
  };

  beforeEach(() => {
    mockAxios = {
      interceptors: {
        response: {
          use: vi.fn(),
        },
      },
      request: vi.fn(),
    };

    (axios.create as Mock).mockImplementation(() => mockAxios);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should call axios.create', async () => {
    await apiRequest('GET', '/path', { config });
    expect(axios.create).toHaveBeenCalledTimes(1);
  });

  it('should set response interceptors based on options.raw', async () => {
    await apiRequest('GET', '/path', { raw: true, config });
    expect(mockAxios.interceptors.response.use.mock.calls[0][0]).toBe(
      undefined,
    );

    vi.clearAllMocks();

    await apiRequest('GET', '/path', { raw: false, config });
    expect(typeof mockAxios.interceptors.response.use.mock.calls[0][0]).toBe(
      'function',
    );
  });

  it('should call AxiosInstance once when apiRequest is called', async () => {
    await apiRequest('GET', '/path', { config });
    expect(mockAxios.request).toHaveBeenCalledTimes(1);
  });

  describe('error handler', () => {
    it('should include location in error for 3xx redirect responses', async () => {
      await apiRequest('GET', '/path', {
        config: { apiPath: 'http://example.com' },
      });

      const errorHandler = mockAxios.interceptors.response.use.mock.calls[0][1];

      await expect(
        errorHandler({
          status: 301,
          response: {
            headers: {
              location: 'http://example.com/++api++/new-path?foo=bar',
            },
            data: undefined,
          },
        }),
      ).rejects.toEqual({
        status: 301,
        data: undefined,
        location: '/new-path',
      });
    });

    it('should not include location in error for non-3xx responses', async () => {
      await apiRequest('GET', '/path', {
        config: { apiPath: 'http://example.com' },
      });

      const errorHandler = mockAxios.interceptors.response.use.mock.calls[0][1];

      await expect(
        errorHandler({
          status: 404,
          response: {
            headers: {},
            data: { message: 'Not found' },
          },
        }),
      ).rejects.toMatchObject({
        status: 404,
        location: undefined,
      });
    });

    it('should strip custom apiSuffix from location for 3xx responses', async () => {
      await apiRequest('GET', '/path', {
        config: { apiPath: 'http://example.com', apiSuffix: '/custom-api' },
      });

      const errorHandler = mockAxios.interceptors.response.use.mock.calls[0][1];

      await expect(
        errorHandler({
          status: 302,
          response: {
            headers: {
              location: 'http://example.com/custom-api/another-path',
            },
            data: undefined,
          },
        }),
      ).rejects.toEqual({
        status: 302,
        data: undefined,
        location: '/another-path',
      });
    });
  });
});

describe('getBackendURL', () => {
  const apiPath = 'http://example.com/plone';

  it('should keep the site root path as a single slash', () => {
    expect(getBackendURL(apiPath, undefined, '/')).toBe(
      'http://example.com/plone/++api++/',
    );
  });

  it('should add a missing leading slash', () => {
    expect(getBackendURL(apiPath, undefined, 'foo')).toBe(
      'http://example.com/plone/++api++/foo',
    );
  });

  it('should strip trailing slashes', () => {
    expect(getBackendURL(apiPath, undefined, '/foo/')).toBe(
      'http://example.com/plone/++api++/foo',
    );
  });

  it('should collapse duplicate slashes', () => {
    expect(getBackendURL(apiPath, undefined, '//@content-rules')).toBe(
      'http://example.com/plone/++api++/@content-rules',
    );
    expect(getBackendURL(apiPath, undefined, '/foo//bar')).toBe(
      'http://example.com/plone/++api++/foo/bar',
    );
  });

  it('should leave embedded query strings untouched', () => {
    expect(getBackendURL(apiPath, undefined, '/@principals?search=foo/')).toBe(
      'http://example.com/plone/++api++/@principals?search=foo/',
    );
    expect(getBackendURL(apiPath, undefined, '/@principals?search=a//b')).toBe(
      'http://example.com/plone/++api++/@principals?search=a//b',
    );
    expect(getBackendURL(apiPath, undefined, '//foo/?redirect=https://x')).toBe(
      'http://example.com/plone/++api++/foo?redirect=https://x',
    );
  });

  it('should return absolute URLs unchanged', () => {
    expect(
      getBackendURL(apiPath, undefined, 'https://cdn.example.com//image.png'),
    ).toBe('https://cdn.example.com//image.png');
    expect(getBackendURL(apiPath, undefined, 'http://other.example/foo')).toBe(
      'http://other.example/foo',
    );
  });

  it('should use a custom apiSuffix', () => {
    expect(getBackendURL(apiPath, '/custom-api', '//foo/')).toBe(
      'http://example.com/plone/custom-api/foo',
    );
  });
});

describe('axiosConfigAdapter', () => {
  it('should create an axios configuration object', () => {
    const method = 'GET';
    const path = '/path';
    const options = {
      config: {
        apiPath: 'apiPath',
        token: 'token123',
      },
      params: { param1: 'value1' },
      data: { data1: 'value2' },
      headers: { header1: 'value3' },
      checkUrl: false,
    };

    const result = axiosConfigAdapter(method, path, options);

    const expected: AxiosRequestConfig = {
      method,
      url: getBackendURL(options.config.apiPath, undefined, path),
      params: options.params,
      headers: {
        Accept: 'application/json',
        ...options.headers,
        Authorization: `Bearer ${options.config.token}`,
      },
      data: options.data,
      validateStatus: function (status) {
        return status >= 200 && status < 300;
      },
    };

    // need to strigify to make sure that `validateStatus` function equality also passes
    expect(JSON.stringify(result)).toEqual(JSON.stringify(expected));
  });

  it('should not include Authorization header when no token provided', () => {
    const method = 'GET';
    const path = '/path';
    const options = {
      config: {
        apiPath: 'apiPath',
      },
      params: { param1: 'value1' },
      data: { data1: 'value2' },
      headers: { header1: 'value3' },
      checkUrl: false,
    };

    const result = axiosConfigAdapter(method, path, options);

    expect(result.headers?.Authorization).toBeUndefined();
  });
});

import type { APIRequestContext } from '@playwright/test';

/** Select a backend explicitly; the default preserves the existing Plone suite. */
export function acceptanceBackend(): 'plone' | 'nick' {
  const backend = process.env.ACCEPTANCE_BACKEND || 'plone';
  if (backend !== 'plone' && backend !== 'nick') {
    throw new Error(`Unsupported acceptance backend: ${backend}`);
  }
  return backend;
}

export function acceptanceApiURL(): string {
  const hostname = process.env.BACKEND_HOST || '127.0.0.1';
  const siteId = process.env.SITE_ID || 'plone';
  const fallback =
    acceptanceBackend() === 'nick'
      ? `http://127.0.0.1:${process.env.NICK_ACCEPTANCE_PORT || '55002'}`
      : `http://${hostname}:55001/${siteId}`;
  return (process.env.API_PATH || fallback).replace(/\/$/, '');
}

export async function acceptanceAuthorization(
  request: APIRequestContext,
  apiURL: string,
  username: string,
  password: string,
): Promise<string> {
  if (acceptanceBackend() === 'plone') {
    return `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
  }

  const response = await request.post(`${apiURL}/@login`, {
    headers: { Accept: 'application/json' },
    data: { login: username, password },
  });
  if (!response.ok()) {
    throw new Error(`Nick fixture login failed: ${response.status()}`);
  }
  const { token } = (await response.json()) as { token?: string };
  if (!token) throw new Error('Nick fixture login returned no token');
  return `Bearer ${token}`;
}

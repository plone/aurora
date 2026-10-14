import { expect, describe, it, vi, afterEach } from 'vitest';
import { RouterContextProvider } from 'react-router';
import { ploneClientContext } from '@plone/aurora/app/middleware.server';
import {
  action,
  validateIdentifier,
  validatePassword,
  validatePasswordMatch,
} from './reset-password';

vi.mock('@plone/react-router', () => ({
  getAuthFromRequest: vi.fn().mockResolvedValue(undefined),
}));

function buildRequest(fields: Record<string, string>) {
  const body = new URLSearchParams(fields);
  return new Request('http://example.com/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
}

function callAction(request: Request, cli: Record<string, unknown>) {
  const context = new RouterContextProvider();
  context.set(ploneClientContext, cli as any);
  return action({
    request,
    params: {},
    context,
    unstable_pattern: '/reset-password',
    unstable_url: new URL(request.url),
  }) as Promise<any>;
}

describe('reset-password validators', () => {
  it('rejects an empty identifier', () => {
    expect(validateIdentifier('   ')).toEqual({ code: 'identifierRequired' });
  });

  it('rejects an email when email-as-login is disabled', () => {
    expect(validateIdentifier('foo@bar.com')).toEqual({
      code: 'usernameNoEmail',
    });
  });

  it('rejects a too-short username and one with spaces', () => {
    expect(validateIdentifier('a')).toEqual({
      code: 'usernameTooShort',
      params: { min: 2 },
    });
    expect(validateIdentifier('john doe')).toEqual({
      code: 'usernameNoSpaces',
    });
    expect(validateIdentifier('johndoe')).toBeNull();
  });

  it('enforces the minimum password length', () => {
    expect(validatePassword('short')).toEqual({
      code: 'passwordTooShort',
      params: { min: 8 },
    });
    expect(validatePassword('longenough')).toBeNull();
  });

  it('detects password mismatches', () => {
    expect(validatePasswordMatch('abcdefgh', 'abcdefgi')).toEqual({
      code: 'passwordsDoNotMatch',
    });
    expect(validatePasswordMatch('abcdefgh', 'abcdefgh')).toBeNull();
  });
});

describe('reset-password action — request flow', () => {
  afterEach(() => vi.restoreAllMocks());

  it('calls resetPassword with the trimmed identifier', async () => {
    const resetPassword = vi.fn().mockResolvedValue({});
    const result = await callAction(
      buildRequest({ mode: 'request', usernameOrEmail: '  john  ' }),
      { resetPassword },
    );
    expect(resetPassword).toHaveBeenCalledWith({ id: 'john' });
    expect(result).toEqual({ ok: true, mode: 'request' });
  });

  it('reports success on a 4xx to avoid user enumeration', async () => {
    const resetPassword = vi.fn().mockRejectedValue({ status: 404 });
    const result = await callAction(
      buildRequest({ mode: 'request', usernameOrEmail: 'ghost' }),
      { resetPassword },
    );
    expect(result).toEqual({ ok: true, mode: 'request' });
  });

  it('surfaces a generic server error on a 5xx', async () => {
    const resetPassword = vi.fn().mockRejectedValue({ status: 500 });
    const result = await callAction(
      buildRequest({ mode: 'request', usernameOrEmail: 'john' }),
      { resetPassword },
    );
    expect(result).toEqual({
      ok: false,
      mode: 'request',
      field: 'form',
      code: 'serverError',
    });
  });

  it('skips the call but reports success when the identifier is empty', async () => {
    const resetPassword = vi.fn();
    const result = await callAction(
      buildRequest({ mode: 'request', usernameOrEmail: '' }),
      { resetPassword },
    );
    expect(resetPassword).not.toHaveBeenCalled();
    expect(result).toEqual({ ok: true, mode: 'request' });
  });
});

describe('reset-password action — set flow', () => {
  afterEach(() => vi.restoreAllMocks());

  const validSet = {
    mode: 'set',
    usernameOrEmail: 'john',
    token: 'tok-123',
    new_password: 'longenough',
    confirm_password: 'longenough',
  };

  it('calls resetPasswordWithToken with the token and password', async () => {
    const resetPasswordWithToken = vi.fn().mockResolvedValue({});
    const result = await callAction(buildRequest(validSet), {
      resetPasswordWithToken,
    });
    expect(resetPasswordWithToken).toHaveBeenCalledWith({
      id: 'john',
      data: { reset_token: 'tok-123', new_password: 'longenough' },
    });
    expect(result).toEqual({ ok: true, mode: 'set' });
  });

  it('rejects a too-short password against the new-password field', async () => {
    const resetPasswordWithToken = vi.fn();
    const result = await callAction(
      buildRequest({
        ...validSet,
        new_password: 'short',
        confirm_password: 'short',
      }),
      { resetPasswordWithToken },
    );
    expect(resetPasswordWithToken).not.toHaveBeenCalled();
    expect(result).toEqual({
      ok: false,
      mode: 'set',
      field: 'newPassword',
      code: 'passwordTooShort',
      params: { min: 8 },
    });
  });

  it('reports a mismatch against the confirm field', async () => {
    const result = await callAction(
      buildRequest({ ...validSet, confirm_password: 'different1' }),
      { resetPasswordWithToken: vi.fn() },
    );
    expect(result).toEqual({
      ok: false,
      mode: 'set',
      field: 'confirmPassword',
      code: 'passwordsDoNotMatch',
    });
  });

  it('fails on a missing token', async () => {
    const result = await callAction(buildRequest({ ...validSet, token: '' }), {
      resetPasswordWithToken: vi.fn(),
    });
    expect(result).toEqual({
      ok: false,
      mode: 'set',
      field: 'form',
      code: 'setFailed',
    });
  });

  it('maps a 4xx from the backend to a generic setFailed error', async () => {
    const resetPasswordWithToken = vi.fn().mockRejectedValue({
      status: 400,
      data: { error: { message: 'Invalid token internal detail' } },
    });
    const result = await callAction(buildRequest(validSet), {
      resetPasswordWithToken,
    });
    expect(result).toEqual({
      ok: false,
      mode: 'set',
      field: 'form',
      code: 'setFailed',
    });
  });
});

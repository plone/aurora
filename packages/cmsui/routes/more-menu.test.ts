import { describe, expect, it, vi } from 'vitest';
import { RouterContextProvider } from 'react-router';
import {
  ploneClientContext,
  ploneContentContext,
} from '@plone/aurora/app/middleware.server';
import { action as menuAction } from './api/more-menu';
import { action as rulesAction, loader as rulesLoader } from './rules';

vi.mock('@plone/react-router', () => ({
  requireAuthCookie: vi.fn().mockResolvedValue('token'),
}));

function args(
  path: string,
  form: Record<string, string>,
  client: Record<string, unknown>,
) {
  const context = new RouterContextProvider();
  context.set(ploneClientContext, client as any);
  context.set(ploneContentContext, { title: 'Page' } as any);
  const request = new Request('http://localhost/test', {
    method: 'POST',
    body: new URLSearchParams(form),
  });
  return {
    request,
    context,
    params: { '*': path },
    pattern: '',
    url: new URL(request.url),
  };
}

describe('More menu actions', () => {
  it('applies a workflow transition to the current content', async () => {
    const createWorkflow = vi.fn().mockResolvedValue({});
    await menuAction(
      args(
        'news',
        { path: '/news', operation: 'workflow', value: 'publish' },
        { createWorkflow },
      ),
    );
    expect(createWorkflow).toHaveBeenCalledWith({
      path: '/news',
      transition: 'publish',
    });
  });
  it('rejects a layout that is not in the content schema', async () => {
    const updateContent = vi.fn();
    const result = await menuAction(
      args(
        'news',
        { path: '/news', operation: 'layout', value: 'unknown' },
        {
          getContent: vi
            .fn()
            .mockResolvedValue({ data: { '@type': 'Folder' } }),
          getType: vi
            .fn()
            .mockResolvedValue({ data: { layouts: ['listing_view'] } }),
          updateContent,
        },
      ),
    );
    expect(result).toMatchObject({ init: { status: 400 } });
    expect(updateContent).not.toHaveBeenCalled();
  });
  it('discards a working copy and returns to its original', async () => {
    const deleteWorkingcopy = vi.fn().mockResolvedValue({});
    const response = await menuAction(
      args(
        'copy',
        { path: '/copy', operation: 'discard', value: 'confirm' },
        {
          getContent: vi.fn().mockResolvedValue({
            data: { working_copy_of: { '@id': '/original' } },
          }),
          deleteWorkingcopy,
        },
      ),
    );
    expect(deleteWorkingcopy).toHaveBeenCalledWith({ path: 'copy' });
    expect(response).toMatchObject({ status: 302 });
    expect((response as Response).headers.get('Location')).toBe('/original');
  });
  it('loads and updates rules on the current content path', async () => {
    const getRules = vi.fn().mockResolvedValue({
      data: {
        'content-rules': {
          assigned_rules: [],
          acquired_rules: [],
          assignable_rules: [],
        },
      },
    });
    const input = args('news', {}, { getRules });
    await rulesLoader(input);
    expect(getRules).toHaveBeenCalledWith({ path: '/news' });
    const updateRules = vi.fn().mockResolvedValue({});
    await rulesAction(
      args('news', { operation: 'Enable', rule: 'rule1' }, { updateRules }),
    );
    expect(updateRules).toHaveBeenCalledWith({
      path: '/news',
      data: { 'form.button.Enable': true, rule_ids: ['rule1'] },
    });
  });
});

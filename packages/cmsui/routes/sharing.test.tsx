import { expect, describe, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { RouterContextProvider } from 'react-router';
import type { SharingEntry } from '@plone/types';
import { loader, action, useSharingEdits } from './sharing';
import {
  ploneClientContext,
  ploneContentContext,
  ploneUserContext,
} from '@plone/aurora/app/middleware.server';

vi.mock('@plone/react-router', () => ({
  requireAuthCookie: vi.fn().mockResolvedValue('fake-token'),
}));

const mockContent = {
  '@id': '/my-page',
  '@type': 'Document',
  title: 'My Page',
};

const mockSharingData = {
  available_roles: [{ id: 'Reader', title: 'Can view' }],
  entries: [
    {
      id: 'editors',
      title: 'Editors',
      type: 'group',
      roles: { Reader: false },
    },
  ],
  inherit: true,
};

describe('Sharing route', () => {
  describe('loader', () => {
    it('fetches sharing data for the path and returns it', async () => {
      const getSharingMock = vi
        .fn()
        .mockResolvedValue({ data: mockSharingData });
      const context = new RouterContextProvider();
      context.set(ploneClientContext, { getSharing: getSharingMock } as any);
      context.set(ploneContentContext, mockContent as any);
      context.set(ploneUserContext, { id: 'admin' } as any);

      const request = new Request(
        'http://localhost:3000/@@sharing/my-page?search=bob',
      );

      const result = await loader({
        request,
        params: { '*': 'my-page' },
        context,
        unstable_pattern: '/@@sharing/*',
        unstable_url: new URL(request.url),
      });

      expect(getSharingMock).toHaveBeenCalledWith({
        path: '/my-page',
        search: 'bob',
      });

      const resultData = (result as any).data;
      expect(resultData.sharingData).toEqual(mockSharingData);
      expect(resultData.content).toEqual({
        '@id': '/my-page',
        title: 'My Page',
      });
      expect(resultData.search).toBe('bob');
      expect(resultData.currentUserId).toBe('admin');
    });
  });

  describe('action', () => {
    it('saves changed role values', async () => {
      const updateSharingMock = vi.fn().mockResolvedValue({});
      const context = new RouterContextProvider();
      context.set(ploneClientContext, {
        updateSharing: updateSharingMock,
      } as any);
      context.set(ploneContentContext, mockContent as any);

      const body = {
        entries: [{ id: 'editors', type: 'group', roles: { Reader: true } }],
        inherit: true,
      };
      const request = new Request('http://localhost:3000/@@sharing/my-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      await action({
        request,
        params: { '*': 'my-page' },
        context,
        unstable_pattern: '/@@sharing/*',
        unstable_url: new URL(request.url),
      });

      expect(updateSharingMock).toHaveBeenCalledWith({
        path: '/my-page',
        data: body,
      });
    });

    it('saves the inherit toggle', async () => {
      const updateSharingMock = vi.fn().mockResolvedValue({});
      const context = new RouterContextProvider();
      context.set(ploneClientContext, {
        updateSharing: updateSharingMock,
      } as any);
      context.set(ploneContentContext, mockContent as any);

      const body = { entries: [], inherit: false };
      const request = new Request('http://localhost:3000/@@sharing/my-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      await action({
        request,
        params: { '*': 'my-page' },
        context,
        unstable_pattern: '/@@sharing/*',
        unstable_url: new URL(request.url),
      });

      expect(updateSharingMock).toHaveBeenCalledWith({
        path: '/my-page',
        data: body,
      });
    });

    it('redirects to the document after saving', async () => {
      const updateSharingMock = vi.fn().mockResolvedValue({});
      const context = new RouterContextProvider();
      context.set(ploneClientContext, {
        updateSharing: updateSharingMock,
      } as any);
      context.set(ploneContentContext, mockContent as any);

      const request = new Request('http://localhost:3000/@@sharing/my-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries: [], inherit: true }),
      });

      const result = await action({
        request,
        params: { '*': 'my-page' },
        context,
        unstable_pattern: '/@@sharing/*',
        unstable_url: new URL(request.url),
      });

      expect((result as Response).status).toBe(302);
      expect((result as Response).headers.get('Location')).toBe('/my-page');
    });

    it('handles the site root', async () => {
      const updateSharingMock = vi.fn().mockResolvedValue({});
      const context = new RouterContextProvider();
      context.set(ploneClientContext, {
        updateSharing: updateSharingMock,
      } as any);
      context.set(ploneContentContext, { ...mockContent, '@id': '/' } as any);

      const request = new Request('http://localhost:3000/@@sharing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries: [], inherit: true }),
      });

      const result = await action({
        request,
        params: {},
        context,
        unstable_pattern: '/@@sharing/*',
        unstable_url: new URL(request.url),
      });

      expect(updateSharingMock).toHaveBeenCalledWith({
        path: '/',
        data: { entries: [], inherit: true },
      });
      expect((result as Response).headers.get('Location')).toBe('/');
    });
  });

  describe('useSharingEdits', () => {
    const availableRoles = [
      { id: 'Reader', title: 'Can view' },
      { id: 'Editor', title: 'Can edit' },
    ];
    const editorsEntry: SharingEntry = {
      id: 'editors',
      title: 'Editors',
      type: 'group',
      login: '',
      disabled: false,
      roles: { Reader: false, Editor: true },
    };
    const inheritedEntry: SharingEntry = {
      id: 'reviewers',
      title: 'Reviewers',
      type: 'group',
      login: '',
      disabled: false,
      roles: { Reader: 'acquired', Editor: false },
    };

    it('starts without edits', () => {
      const { result } = renderHook(() => useSharingEdits('/my-page|', true));

      expect(result.current.hasEdits).toBe(false);
      expect(result.current.isSelected(editorsEntry, 'Reader')).toBe(false);
      expect(result.current.isSelected(editorsEntry, 'Editor')).toBe(true);
      expect(result.current.inherit).toBe(true);
    });

    it('tracks a toggled role and reverts when toggled back', () => {
      const { result } = renderHook(() => useSharingEdits('/my-page|', true));

      act(() => result.current.toggle(editorsEntry, 'Reader', true));
      expect(result.current.isSelected(editorsEntry, 'Reader')).toBe(true);
      expect(result.current.hasEdits).toBe(true);

      act(() => result.current.toggle(editorsEntry, 'Reader', false));
      expect(result.current.isSelected(editorsEntry, 'Reader')).toBe(false);
      expect(result.current.hasEdits).toBe(false);
    });

    it('counts an inherit change as an edit', () => {
      const { result } = renderHook(() => useSharingEdits('/my-page|', true));

      act(() => result.current.setInherit(false));
      expect(result.current.hasEdits).toBe(true);

      act(() => result.current.setInherit(true));
      expect(result.current.hasEdits).toBe(false);
    });

    it('builds only changed entries, each with its full boolean role map', () => {
      const { result } = renderHook(() => useSharingEdits('/my-page|', true));

      act(() => result.current.toggle(inheritedEntry, 'Editor', true));

      const changed = result.current.buildChangedEntries(
        [editorsEntry, inheritedEntry],
        availableRoles,
      );

      expect(changed).toEqual([
        {
          id: 'reviewers',
          type: 'group',
          roles: { Editor: true },
        },
      ]);
    });

    it('resets edits and inherit when the key changes', () => {
      const { result, rerender } = renderHook(
        ({ resetKey, inherit }) => useSharingEdits(resetKey, inherit),
        { initialProps: { resetKey: '/my-page|', inherit: true } },
      );

      act(() => result.current.toggle(editorsEntry, 'Reader', true));
      act(() => result.current.setInherit(false));
      expect(result.current.hasEdits).toBe(true);

      rerender({ resetKey: '/other-page|', inherit: true });

      expect(result.current.hasEdits).toBe(false);
      expect(result.current.isSelected(editorsEntry, 'Reader')).toBe(false);
      expect(result.current.inherit).toBe(true);
    });
  });
});

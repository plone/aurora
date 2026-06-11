import { expect, describe, it } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { SharingEntry } from '@plone/types';
import { useSharingEdits } from './SharingForm';

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

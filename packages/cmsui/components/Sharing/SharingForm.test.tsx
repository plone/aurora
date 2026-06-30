import { expect, describe, it, vi } from 'vitest';
import {
  render,
  screen,
  fireEvent,
  renderHook,
  act,
} from '@testing-library/react';
import type { SharingEntry, SharingResponse } from '@plone/types';
import SharingForm, { useSharingEdits } from './SharingForm';

vi.mock('react-router', () => ({
  Form: ({ children }: any) => <form>{children}</form>,
  useFetcher: () => ({ state: 'idle', submit: vi.fn() }),
}));

vi.mock('@plone/components/Icons', () => ({
  WorldIcon: () => null,
  ArrowupIcon: () => null,
  UserIcon: () => null,
  SocialIcon: () => null,
  CheckboxIcon: () => null,
}));

vi.mock('@plone/components/quanta', () => ({
  Checkbox: ({ isSelected, isDisabled, onChange, children, ...props }: any) => (
    <label>
      {children}
      <input
        type="checkbox"
        checked={!!isSelected}
        disabled={isDisabled}
        aria-label={props['aria-label']}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  ),
  Table: ({ children, ...props }: any) => (
    <table aria-label={props['aria-label']}>{children}</table>
  ),
  TableHeader: ({ children }: any) => (
    <thead>
      <tr>{children}</tr>
    </thead>
  ),
  Column: ({ children }: any) => <th>{children}</th>,
  TableBody: ({ children }: any) => <tbody>{children}</tbody>,
  Row: ({ children }: any) => <tr>{children}</tr>,
  Cell: ({ children }: any) => <td>{children}</td>,
  SearchField: ({ label, ...props }: any) => (
    <input aria-label={label} {...props} />
  ),
  Button: ({ children, onPress, isDisabled, ...props }: any) => (
    <button
      onClick={onPress}
      disabled={isDisabled}
      aria-label={props['aria-label']}
    >
      {children}
    </button>
  ),
  Description: ({ children, ...props }: any) => (
    <div {...props}>{children}</div>
  ),
}));

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
    const { result } = renderHook(() => useSharingEdits(true));

    expect(result.current.hasEdits).toBe(false);
    expect(result.current.isSelected(editorsEntry, 'Reader')).toBe(false);
    expect(result.current.isSelected(editorsEntry, 'Editor')).toBe(true);
    expect(result.current.inherit).toBe(true);
  });

  it('tracks a toggled role and reverts when toggled back', () => {
    const { result } = renderHook(() => useSharingEdits(true));

    act(() => result.current.toggle(editorsEntry, 'Reader', true));
    expect(result.current.isSelected(editorsEntry, 'Reader')).toBe(true);
    expect(result.current.hasEdits).toBe(true);

    act(() => result.current.toggle(editorsEntry, 'Reader', false));
    expect(result.current.isSelected(editorsEntry, 'Reader')).toBe(false);
    expect(result.current.hasEdits).toBe(false);
  });

  it('counts an inherit change as an edit', () => {
    const { result } = renderHook(() => useSharingEdits(true));

    act(() => result.current.setInherit(false));
    expect(result.current.hasEdits).toBe(true);

    act(() => result.current.setInherit(true));
    expect(result.current.hasEdits).toBe(false);
  });

  it('builds only changed entries, each with its full boolean role map', () => {
    const { result } = renderHook(() => useSharingEdits(true));

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
});

describe('SharingForm', () => {
  const content = { '@id': '/my-page', title: 'My Page' };
  const sharingData: SharingResponse = {
    available_roles: [
      { id: 'Reader', title: 'Can view' },
      { id: 'Editor', title: 'Can edit' },
    ],
    entries: [
      {
        id: 'editors',
        title: 'Editors',
        type: 'group',
        login: '',
        disabled: false,
        roles: { Reader: false, Editor: true },
      },
    ],
    inherit: true,
  };

  it('discards unsaved edits when remounted with a new key (document/search change)', () => {
    const { rerender } = render(
      <SharingForm
        key={`${content['@id']}|`}
        content={content}
        sharingData={sharingData}
        search=""
        currentUserId={null}
      />,
    );

    const reader = screen.getByRole('checkbox', { name: 'Can view' });
    const save = screen.getByRole('button', { name: 'cmsui.save' });
    expect(reader).not.toBeChecked();
    expect(save).toBeDisabled();

    fireEvent.click(reader);
    expect(reader).toBeChecked();
    expect(save).toBeEnabled();

    rerender(
      <SharingForm
        key="/other-page|"
        content={content}
        sharingData={sharingData}
        search=""
        currentUserId={null}
      />,
    );

    expect(
      screen.getByRole('checkbox', { name: 'Can view' }),
    ).not.toBeChecked();
    expect(screen.getByRole('button', { name: 'cmsui.save' })).toBeDisabled();
  });
});

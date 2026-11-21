import { describe, expect, it } from 'vitest';
import type { Content } from '@plone/types';
import { canEdit, canViewContents } from './index';

const withActions = (object: { id: string }[]) =>
  ({ '@components': { actions: { object } } }) as unknown as Content;

describe('canViewContents', () => {
  it('is true with the folderContents object action', () => {
    expect(canViewContents(withActions([{ id: 'folderContents' }]))).toBe(true);
  });

  it('is false without it', () => {
    expect(canViewContents(withActions([{ id: 'view' }]))).toBe(false);
    expect(canViewContents(undefined)).toBe(false);
  });
});

describe('canEdit', () => {
  it('is true with the edit object action or object button', () => {
    expect(canEdit(withActions([{ id: 'edit' }]))).toBe(true);
    expect(
      canEdit({
        '@components': { actions: { object_buttons: [{ id: 'edit' }] } },
      } as unknown as Content),
    ).toBe(true);
  });

  it('is false without it', () => {
    expect(canEdit(withActions([{ id: 'view' }]))).toBe(false);
    expect(canEdit(undefined)).toBe(false);
  });
});

import { atom, type PrimitiveAtom } from 'jotai';
import { atomFamily } from 'jotai/utils';
import { focusAtom } from 'jotai-optics';
import { useFieldValueFocusedAtom } from '@plone/helpers';
import type { Content } from '@plone/types';

export const formAtom = atom<Content>({} as Content);

export const blockAtomFamily = atomFamily((id: string) =>
  focusAtom(formAtom, (optic) => optic.prop('blocks').prop(id)),
);

export const recurrenceAtom = atom<string | null>(null);

/**
 * Reads one top-level field of the form. The component re-renders only when
 * that field changes, not on every change to the form, as reading the whole
 * `formAtom` would.
 */
export const useFormFieldValue = <T = unknown>(name: string) =>
  useFieldValueFocusedAtom(
    formAtom as unknown as PrimitiveAtom<Record<string, unknown>>,
    name,
  ) as T | undefined;

import { useCallback, useEffect, useRef } from 'react';
import { atom, useAtomValue } from 'jotai';
import { useOptionalFormContext } from '@plone/helpers';
import {
  useEditorRef,
  useEditorSelector,
  type TPlateEditor,
} from 'platejs/react';

type BindingState = {
  isActive: boolean;
  value: string | null;
};

type SyncAction = 'editor-to-field' | 'field-to-editor' | 'none';

type GetSyncActionArgs = {
  editorValue: string | null;
  fieldValue: string;
  isEditorActive: boolean;
  lastAppliedFromEditor: string | null;
  lastAppliedFromField: string | null;
};

type MetadataTextBinding = {
  field: string;
  getState: (editor: TPlateEditor) => BindingState;
  writeToEditor: (editor: TPlateEditor, value: string) => void;
};

// Read when the editor is not inside a form: the binding is then inactive.
const noFieldAtom = atom<unknown>(undefined);

export function getMetadataTextSyncAction({
  editorValue,
  fieldValue,
  isEditorActive,
  lastAppliedFromEditor,
  lastAppliedFromField,
}: GetSyncActionArgs): SyncAction {
  if (editorValue === null) return 'none';
  if (editorValue === fieldValue) return 'none';
  if (lastAppliedFromField !== null && editorValue === lastAppliedFromField) {
    return 'none';
  }
  if (lastAppliedFromEditor !== null && fieldValue === lastAppliedFromEditor) {
    return 'none';
  }

  return isEditorActive ? 'editor-to-field' : 'field-to-editor';
}

export function useMetadataTextBinding(binding: MetadataTextBinding) {
  const { field, getState, writeToEditor } = binding;
  const editor = useEditorRef();
  const lastAppliedFromEditorRef = useRef<string | null>(null);
  const lastAppliedFromFieldRef = useRef<string | null>(null);

  // Callers pass a fresh `binding` object literal on every render. Stash the
  // callbacks in refs so the selector and effect deps below stay stable —
  // otherwise this hook re-subscribes and re-fires every render, looping
  // setState back into the editor / form atom.
  const getStateRef = useRef(getState);
  const writeToEditorRef = useRef(writeToEditor);
  useEffect(() => {
    getStateRef.current = getState;
    writeToEditorRef.current = writeToEditor;
  });

  // The form the editor is rendered in, for example the content form.
  const form = useOptionalFormContext();
  const fieldValue = useAtomValue(
    form ? form.fieldAtom(field) : noFieldAtom,
    form ? { store: form.store } : undefined,
  );
  const setFieldValue = useCallback(
    (value: string) => form?.setFieldValue(field, value),
    [form, field],
  );
  const state = useEditorSelector(
    (currentEditor) => getStateRef.current(currentEditor as TPlateEditor),
    [],
  );

  const hasFormAtom = !!form;
  const normalizedFieldValue = typeof fieldValue === 'string' ? fieldValue : '';

  useEffect(() => {
    if (!hasFormAtom) {
      lastAppliedFromEditorRef.current = null;
      lastAppliedFromFieldRef.current = null;
      return;
    }

    if (
      lastAppliedFromEditorRef.current !== null &&
      normalizedFieldValue === lastAppliedFromEditorRef.current
    ) {
      lastAppliedFromEditorRef.current = null;
    }

    if (
      lastAppliedFromFieldRef.current !== null &&
      state.value === lastAppliedFromFieldRef.current
    ) {
      lastAppliedFromFieldRef.current = null;
    }

    const action = getMetadataTextSyncAction({
      editorValue: state.value,
      fieldValue: normalizedFieldValue,
      isEditorActive: state.isActive,
      lastAppliedFromEditor: lastAppliedFromEditorRef.current,
      lastAppliedFromField: lastAppliedFromFieldRef.current,
    });

    if (action === 'editor-to-field' && state.value !== null) {
      lastAppliedFromEditorRef.current = state.value;
      setFieldValue(state.value);
      return;
    }

    if (action === 'field-to-editor') {
      lastAppliedFromFieldRef.current = normalizedFieldValue;
      writeToEditorRef.current(
        editor as unknown as TPlateEditor,
        normalizedFieldValue,
      );
    }
  }, [
    editor,
    hasFormAtom,
    normalizedFieldValue,
    setFieldValue,
    state.isActive,
    state.value,
  ]);
}

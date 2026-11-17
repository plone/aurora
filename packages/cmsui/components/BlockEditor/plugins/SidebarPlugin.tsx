import * as React from 'react';
import { createPortal } from 'react-dom';
import {
  BlockSelectionPlugin,
  createPlatePlugin,
  ElementApi,
  getBlockConfig,
  getClosestPloneBlockEntry,
  useEditorRef,
  useEditorSelector,
} from '@plone/plate/components/editor';
import {
  InnerBlockSettingsActions,
  InnerBlockSettingsHeader,
  useSettingsTarget,
} from '@plone/plate/components/ui/block-settings';
import { PLONE_BLOCK_TYPE } from '@plone/helpers';
import type { BlockConfigBase } from '@plone/types';
import BlockSettingsForm from '../BlockSettingsForm';

type SelectedNativeBlock = {
  key: string;
  path: number[];
  data: Record<string, unknown> & { '@type': string };
  schema: BlockConfigBase['blockSchema'];
  title: string;
};

const isPloneBlockElement = (node: unknown) =>
  ElementApi.isElement(node) && node.type === PLONE_BLOCK_TYPE;

const getPloneBlockFromBlockSelection = (
  editor: any,
): [any, number[]] | null => {
  const entries =
    editor
      .getApi(BlockSelectionPlugin)
      ?.blockSelection?.getNodes?.({ selectionFallback: true, sort: true }) ??
    [];

  for (let index = entries.length - 1; index >= 0; index -= 1) {
    const [node, path] = entries[index];
    if (isPloneBlockElement(node)) return [node, path];
  }

  return null;
};

const getPloneBlockFromActiveElement = (
  editor: any,
): [any, number[]] | null => {
  if (typeof document === 'undefined') return null;

  const activeElement = document.activeElement as HTMLElement | null;
  const blockElement = activeElement?.closest?.('[data-slate-node="element"]');
  if (!blockElement) return null;

  try {
    const node = editor.api.toSlateNode(blockElement);
    if (!isPloneBlockElement(node)) return null;
    const path = editor.api.findPath(node);
    return path ? [node, path] : null;
  } catch {
    return null;
  }
};

// The Plone block that holds the selection, which may be nested, in an
// accordion panel for example.
const getPloneBlockFromSelection = (editor: any): [any, number[]] | null => {
  if (!editor.selection) return null;
  const entry = getClosestPloneBlockEntry(editor);
  return entry && isPloneBlockElement(entry[0]) ? entry : null;
};

const getSelectedNativeBlock = (editor: any): SelectedNativeBlock | null => {
  const entry =
    getPloneBlockFromBlockSelection(editor) ??
    getPloneBlockFromActiveElement(editor) ??
    getPloneBlockFromSelection(editor);
  if (!entry) return null;

  const [node, path] = entry;
  if (!isPloneBlockElement(node)) return null;

  const blockType = node['@type'];
  if (typeof blockType !== 'string') return null;

  // Inside a container, such as an accordion, the container's overrides
  // apply: some settings may not be offered there.
  const blockConfig = getBlockConfig(editor, blockType, { at: path });
  if (!blockConfig?.blockSchema) return null;

  const data = { ...node } as Record<string, unknown>;
  delete data.id;
  delete data.type;
  delete data.children;

  return {
    key: path.join('-'),
    path,
    data: {
      ...data,
      '@type': blockType,
    },
    schema: blockConfig.blockSchema,
    title:
      typeof blockConfig.title === 'string' ? blockConfig.title : blockType,
  };
};

const resolveSchema = (
  schema: BlockConfigBase['blockSchema'],
  args: Record<string, unknown>,
) => (typeof schema === 'function' ? (schema as any)(args) : schema);

export function SidebarAfterEditable() {
  const editor = useEditorRef();
  const selectedNativeBlock = useEditorSelector(getSelectedNativeBlock, []);
  // A chosen level's settings, such as an accordion's, take the sidebar.
  const settingsTarget = useSettingsTarget();

  const onFormDataChange = React.useCallback(
    (next: Record<string, unknown>) => {
      if (!selectedNativeBlock) return;
      const patch = { ...next };
      delete patch.id;
      delete patch.type;
      delete patch.children;
      editor.tf.setNodes(patch as any, { at: selectedNativeBlock.path });
    },
    [editor, selectedNativeBlock],
  );

  const schema = React.useMemo(() => {
    if (!selectedNativeBlock) return undefined;
    const { schema: blockSchema } = selectedNativeBlock;
    return (args: Record<string, unknown>) => resolveSchema(blockSchema, args);
  }, [selectedNativeBlock]);

  const sidebar =
    typeof document === 'undefined' ? null : document.getElementById('sidebar');

  if (!sidebar) return null;
  if (!selectedNativeBlock || !schema) return null;
  if (settingsTarget) return null;

  const note = (
    schema({ formData: selectedNativeBlock.data }) as { description?: string }
  )?.description;

  return createPortal(
    <>
      <InnerBlockSettingsHeader
        path={selectedNativeBlock.path}
        blockLabel={selectedNativeBlock.title}
        note={note}
      />
      <BlockSettingsForm
        key={selectedNativeBlock.key}
        schema={schema as unknown as BlockConfigBase['blockSchema']}
        formData={selectedNativeBlock.data}
        onFormDataChange={onFormDataChange}
      />
      <InnerBlockSettingsActions path={selectedNativeBlock.path} />
    </>,
    sidebar,
  );
}

export const SidebarPlugin = createPlatePlugin({
  key: 'cmsui-sidebar',
  render: {
    afterEditable: SidebarAfterEditable,
  },
});

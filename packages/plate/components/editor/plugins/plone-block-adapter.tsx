import React from 'react';
import { BlockSelectionPlugin } from '@platejs/selection/react';
import { isDeepEqual, PLONE_BLOCK_TYPE } from '@plone/helpers';
import config from '@plone/registry';
import { createSlatePlugin, ElementApi, PathApi, type TElement } from 'platejs';
import {
  PlateElement,
  type PlateEditor,
  toPlatePlugin,
  useEditorRef,
  useSelected,
  type PlateElementProps,
} from 'platejs/react';
import { BlockInnerContainer } from '../../ui/block-inner-container';

type NativeBlockElement = TElement & {
  id?: string;
  '@type'?: string;
  [key: string]: unknown;
};

type NativeBlockData = Record<string, unknown> & {
  '@type': string;
};

function toBlockData(element: NativeBlockElement): NativeBlockData | null {
  const blockType = element['@type'];
  if (!blockType || typeof blockType !== 'string') return null;

  const rest = { ...element } as Record<string, unknown>;
  delete rest.id;
  delete rest.type;
  delete rest.children;

  return {
    ...rest,
    '@type': blockType,
  };
}

function fromBlockData(data: NativeBlockData): Partial<NativeBlockElement> {
  const rest = { ...data } as Record<string, unknown>;
  delete rest.id;
  delete rest.type;
  delete rest.children;
  return rest;
}

function getBlockConfig(blockType: string) {
  const blocksConfig = config?.blocks?.blocksConfig as unknown | undefined;
  return (blocksConfig as Record<string, unknown> | undefined)?.[blockType] as
    | {
        edit?: React.ComponentType<any>;
        view?: React.ComponentType<any>;
      }
    | undefined;
}

function getBlockId(element: NativeBlockElement, path: number[]) {
  const explicitId = element?.id;
  return explicitId ? String(explicitId) : path.join('-');
}

const getTopLevelBlockPath = (path: number[]) =>
  path.length > 1 ? [path[0]] : path;

function PloneBlockAdapterContent(
  props: PlateElementProps<NativeBlockElement> & {
    path: number[];
    baseAttributes: PlateElementProps<NativeBlockElement>['attributes'];
    editor: PlateEditor;
    selected: boolean;
  },
) {
  const { children: _children, element, ...restProps } = props;
  const { baseAttributes, editor, path, selected } = props;
  const pathRef = React.useRef(path);
  pathRef.current = path;

  const blockData = React.useMemo(() => toBlockData(element), [element]);
  const blockType = blockData?.['@type'];
  const block = blockType ? getBlockConfig(blockType) : null;
  const blockId = React.useMemo(
    () => getBlockId(element, path),
    [element, path],
  );
  const Edit = block?.edit;
  const View = block?.view;

  const handleSetBlock = React.useCallback(
    (data: NativeBlockData) => {
      const mapped = fromBlockData(data);
      const current = editor.api.node(pathRef.current)?.[0] as
        | NativeBlockElement
        | undefined;
      const next = current
        ? ({ ...current, ...mapped } as NativeBlockElement)
        : mapped;

      if (!isDeepEqual(current, next)) {
        editor.tf.setNodes(mapped as any, { at: pathRef.current });
      }
    },
    [editor],
  );

  const handleChangeBlock = React.useCallback(
    (_block: string, data: NativeBlockData) => {
      handleSetBlock(data);
    },
    [handleSetBlock],
  );

  const handleSelectBlock = React.useCallback(() => {
    const currentPath = editor.api.findPath(element);
    if (!currentPath) return;

    const elementId = element?.id;
    if (elementId) {
      editor.getApi(BlockSelectionPlugin).blockSelection.set(String(elementId));
    }

    editor.tf.focus();
    editor.tf.select(currentPath);
  }, [editor, element]);

  const interactiveAttributes = {
    ...baseAttributes,
  };

  const className = [
    restProps.className,
    selected && 'rounded-sm outline-2 outline-quanta-sapphire',
  ]
    .filter(Boolean)
    .join(' ');

  if (!blockData || !block) {
    return (
      <PlateElement
        {...restProps}
        attributes={baseAttributes}
        element={element}
      >
        {_children}
      </PlateElement>
    );
  }

  return (
    <PlateElement
      {...restProps}
      attributes={interactiveAttributes}
      element={element}
      className={className}
    >
      <BlockInnerContainer>
        {Edit ? (
          <Edit
            data={blockData}
            block={blockId}
            selected={selected}
            setBlock={handleSetBlock}
            onChangeBlock={handleChangeBlock}
            onSelectBlock={handleSelectBlock}
            blocksConfig={config.blocks.blocksConfig}
            blocksErrors={{}}
            navRoot={config.settings?.navRootPath}
            contentType={blockData['@type']}
          />
        ) : View ? (
          <View data={blockData} />
        ) : null}
      </BlockInnerContainer>
    </PlateElement>
  );
}

export function PloneBlockAdapterElement(
  props: PlateElementProps<NativeBlockElement>,
) {
  const { element, ...restProps } = props;
  const baseAttributes = {
    ...restProps.attributes,
    contentEditable: false,
  };
  const editor = useEditorRef();
  const selected = useSelected();
  const path = React.useMemo(
    () => editor.api.findPath(element),
    [editor, element],
  );

  if (!path) return null;

  return (
    <PloneBlockAdapterContent
      {...props}
      path={path}
      baseAttributes={baseAttributes}
      editor={editor}
      selected={selected}
    />
  );
}

export const BasePloneBlockKeyboardPlugin = createSlatePlugin({
  key: `${PLONE_BLOCK_TYPE}Keyboard`,
  handlers: {
    onKeyDown: ({ editor, event }: { editor: PlateEditor; event: any }) => {
      if (event.defaultPrevented) return;

      const nativeEvent = (event as any)?.nativeEvent ?? event;
      if (!nativeEvent) return;
      if (!editor.selection || !editor.api.isCollapsed()) return;

      const currentEntry = editor.api.block({ highest: true });
      if (!currentEntry) return;

      const [currentNode, currentPath] = currentEntry;
      const currentBlockPath = getTopLevelBlockPath(currentPath as number[]);
      const currentIsPloneBlock =
        ElementApi.isElement(currentNode) &&
        currentNode.type === PLONE_BLOCK_TYPE;

      if (nativeEvent.key === 'Enter' && currentIsPloneBlock) {
        event.preventDefault();

        const nextPath = PathApi.next(currentBlockPath);
        const nextNode = editor.api.node(nextPath)?.[0];

        if (
          ElementApi.isElement(nextNode) &&
          nextNode.type !== PLONE_BLOCK_TYPE
        ) {
          editor.tf.focus();
          editor.tf.select([...nextPath, 0]);
          editor.tf.collapse({ edge: 'start' });
          return;
        }

        editor.tf.insertNodes(
          editor.api.create.block({
            type: 'p',
            children: [{ text: '' }],
          }),
          {
            at: nextPath,
            select: true,
          },
        );
        return;
      }

      if (nativeEvent.key === 'ArrowUp' && currentIsPloneBlock) {
        event.preventDefault();

        let previousPath: number[] | undefined;
        try {
          previousPath = PathApi.previous(currentBlockPath);
        } catch {
          return;
        }
        if (!previousPath) return;

        const previousNode = editor.api.node(previousPath)?.[0];
        editor.tf.focus();
        if (
          ElementApi.isElement(previousNode) &&
          previousNode.type === PLONE_BLOCK_TYPE
        ) {
          editor.tf.select([...previousPath, 0]);
          editor.tf.collapse({ edge: 'start' });
          return;
        }
        editor.tf.select([...previousPath, 0]);
        editor.tf.collapse({ edge: 'end' });
        return;
      }

      if (nativeEvent.key === 'ArrowDown' && currentIsPloneBlock) {
        event.preventDefault();

        const nextPath = PathApi.next(currentBlockPath);
        const nextNode = editor.api.node(nextPath)?.[0];
        if (!nextNode) return;

        editor.tf.focus();
        if (
          ElementApi.isElement(nextNode) &&
          nextNode.type === PLONE_BLOCK_TYPE
        ) {
          editor.tf.select([...nextPath, 0]);
          editor.tf.collapse({ edge: 'start' });
          return;
        }
        editor.tf.select([...nextPath, 0]);
        editor.tf.collapse({ edge: 'start' });
        return;
      }

      if (nativeEvent.key === 'ArrowDown') {
        let nextPath: number[] | undefined;
        try {
          nextPath = PathApi.next(currentBlockPath);
        } catch {
          return;
        }

        if (!nextPath) return;

        const nextNode = editor.api.node(nextPath)?.[0];
        if (
          ElementApi.isElement(nextNode) &&
          nextNode.type === PLONE_BLOCK_TYPE
        ) {
          event.preventDefault();
          editor.tf.focus();
          editor.tf.select([...nextPath, 0]);
          editor.tf.collapse({ edge: 'start' });
        }
        return;
      }

      if (nativeEvent.key !== 'ArrowUp') return;

      let previousPath: number[] | undefined;
      try {
        previousPath = PathApi.previous(currentBlockPath);
      } catch {
        return;
      }

      if (!previousPath) return;

      const previousNode = editor.api.node(previousPath)?.[0];
      if (
        ElementApi.isElement(previousNode) &&
        previousNode.type === PLONE_BLOCK_TYPE
      ) {
        event.preventDefault();
        editor.tf.focus();
        editor.tf.select([...previousPath, 0]);
        editor.tf.collapse({ edge: 'start' });
      }
    },
  } as any,
});

export const BasePloneBlockAdapterPlugin = createSlatePlugin({
  key: PLONE_BLOCK_TYPE,
  node: {
    component: PloneBlockAdapterElement,
    isVoid: true,
    isElement: true,
    type: PLONE_BLOCK_TYPE,
  },
  extendEditor: ({ editor }) => {
    const insertBreak = editor.tf.insertBreak;

    editor.tf.insertBreak = () => {
      const blockEntry = editor.api.block({ highest: true });
      if (blockEntry) {
        const [node, path] = blockEntry;
        if (ElementApi.isElement(node) && node.type === PLONE_BLOCK_TYPE) {
          const nextPath = PathApi.next(path);
          const nextNode = editor.api.node(nextPath)?.[0];

          if (
            ElementApi.isElement(nextNode) &&
            nextNode.type !== PLONE_BLOCK_TYPE
          ) {
            editor.tf.focus();
            editor.tf.select([...nextPath, 0]);
            editor.tf.collapse({ edge: 'start' });
            return;
          }

          editor.tf.insertNodes(
            editor.api.create.block({
              type: 'p',
              children: [{ text: '' }],
            }),
            {
              at: PathApi.next(path),
              select: true,
            },
          );
          return;
        }
      }

      insertBreak();
    };

    return editor;
  },
});

export const PloneBlockKeyboardPlugin = toPlatePlugin(
  BasePloneBlockKeyboardPlugin,
);

export const PloneBlockAdapterPlugin = toPlatePlugin(
  BasePloneBlockAdapterPlugin,
);

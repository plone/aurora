import {
  createSlatePlugin,
  ElementApi,
  PathApi,
  type SetNodesOptions,
  type SlateEditor,
  type TElement,
} from 'platejs';
import { PLONE_BLOCK_TYPE } from '@plone/helpers';
import config from '@plone/registry';
import type { StyleDefinition } from '@plone/types';
import { toPlatePlugin } from 'platejs/react';

export const BLOCK_WIDTH_KEY = 'blockWidth';
export const FALLBACK_BLOCK_WIDTH = 'default';

export type BlockWidthValue = string;

export type BlockWidthConfig = {
  defaultWidth?: BlockWidthValue;
  widths?: readonly BlockWidthValue[];
};

export type BlockWidthPluginOptions = {
  defaultWidths?: readonly BlockWidthValue[];
};

const FALLBACK_WIDTH_DEFINITIONS: readonly StyleDefinition[] = [
  {
    style: {
      '--block-width': 'var(--narrow-container-width)',
    },
    name: 'narrow',
    label: 'Narrow',
  },
  {
    style: {
      '--block-width': 'var(--default-container-width)',
    },
    name: 'default',
    label: 'Default',
  },
  {
    style: {
      '--block-width': 'var(--layout-container-width)',
    },
    name: 'layout',
    label: 'Layout',
  },
  {
    style: {
      '--block-width': '100%',
    },
    name: 'full',
    label: 'Full Width',
  },
] as const;

export const getBlockWidthDefinitions = (): readonly StyleDefinition[] => {
  const widths = config?.blocks?.widths as StyleDefinition[] | undefined;

  return widths?.length ? widths : FALLBACK_WIDTH_DEFINITIONS;
};

export const getBlockWidthValueList = (): BlockWidthValue[] =>
  getBlockWidthDefinitions()
    .map((width) => width.name)
    .filter((name): name is string => !!name);

export const getDefaultBlockWidth = (): BlockWidthValue => {
  const widthValues = getBlockWidthValueList();

  if (!widthValues.length) return FALLBACK_BLOCK_WIDTH;
  if (widthValues.includes(FALLBACK_BLOCK_WIDTH)) return FALLBACK_BLOCK_WIDTH;

  return widthValues[0];
};

export const getBlockWidthOptions = () =>
  getBlockWidthDefinitions().map((width) => ({
    label: width.label,
    value: width.name as BlockWidthValue,
  }));

const getBlockWidthStyle = (value?: string) =>
  getBlockWidthDefinitions().find((width) => width.name === value)?.style;

const getPlateBlockRegistryWidthConfig = (
  element?: TElement | null,
): BlockWidthConfig => {
  if (!element?.type) return {};

  const plateBlocksConfig = config?.blocks?.plateBlocksConfig as
    Record<string, { blockWidth?: BlockWidthConfig }> | undefined;

  return plateBlocksConfig?.[element.type]?.blockWidth ?? {};
};

export const resolveBlockWidthConfig = (
  editor: SlateEditor,
  element?: TElement | null,
): BlockWidthConfig => {
  if (element?.type === PLONE_BLOCK_TYPE) {
    return {};
  }

  const registryConfig = getPlateBlockRegistryWidthConfig(element);

  if (registryConfig.defaultWidth || registryConfig.widths?.length) {
    return registryConfig;
  }

  const pluginOptions = editor.getOptions(BaseBlockWidthPlugin) as
    BlockWidthPluginOptions | undefined;

  return {
    widths: pluginOptions?.defaultWidths,
  };
};

export const getBlockWidthConfig = (
  editor: SlateEditor,
  element?: TElement | null,
) => {
  const blockConfig = resolveBlockWidthConfig(editor, element);
  const defaultWidth = blockConfig.defaultWidth ?? getDefaultBlockWidth();
  const registryWidths = getBlockWidthValueList();
  const widths =
    blockConfig.widths ?? (registryWidths.length ? registryWidths : []);

  return {
    defaultWidth,
    widths: widths.includes(defaultWidth)
      ? widths
      : ([...widths, defaultWidth] as BlockWidthValue[]),
  };
};

const isAllowedWidth = (widths: readonly BlockWidthValue[], value: string) =>
  widths.includes(value as BlockWidthValue);

type ValueElement = Record<string, unknown> & {
  type?: unknown;
  children?: unknown[];
};

/**
 * Sets the width of every top-level native block that has none (or one it
 * does not allow). With an `editor`, it resolves widths exactly like the
 * editor's normalization does, so a saved value loads unchanged.
 */
export const applyBlockWidthDefaultsInValue = (
  value: unknown[],
  editor?: SlateEditor,
) => {
  const fallbackWidths = getBlockWidthValueList();
  const fallbackDefaultWidth = getDefaultBlockWidth();

  const applyDefault = (node: unknown) => {
    if (!node || typeof node !== 'object') return;

    const element = node as ValueElement;
    if (typeof element.type !== 'string') return;

    if (element.type === PLONE_BLOCK_TYPE) {
      return;
    }

    if (editor) {
      element[BLOCK_WIDTH_KEY] = getEffectiveBlockWidth(
        editor,
        element as TElement,
      );
      return;
    }

    const registryConfig = getPlateBlockRegistryWidthConfig(
      element as TElement,
    );
    const defaultWidth = registryConfig.defaultWidth ?? fallbackDefaultWidth;
    const widths = registryConfig.widths?.length
      ? registryConfig.widths
      : fallbackWidths;
    const currentWidth = element[BLOCK_WIDTH_KEY];

    if (typeof currentWidth !== 'string' || !widths.includes(currentWidth)) {
      element[BLOCK_WIDTH_KEY] = defaultWidth;
    }
  };

  value.forEach(applyDefault);
  return value;
};

export const getEffectiveBlockWidth = (
  editor: SlateEditor,
  element?: TElement | null,
) => {
  const current = element?.[BLOCK_WIDTH_KEY];
  const { defaultWidth, widths } = getBlockWidthConfig(editor, element);

  if (typeof current === 'string' && isAllowedWidth(widths, current)) {
    return current;
  }

  return defaultWidth;
};

export const withBlockWidthDefaults = <T extends TElement>(
  editor: SlateEditor,
  element: T,
): T => {
  if (element.type === PLONE_BLOCK_TYPE) {
    return element;
  }

  const width = getEffectiveBlockWidth(editor, element);

  if (element[BLOCK_WIDTH_KEY] === width) {
    return element;
  }

  return {
    ...element,
    [BLOCK_WIDTH_KEY]: width,
  };
};

const withCreatedBlockWidthDefaults = (
  editor: SlateEditor,
  nodes: unknown,
): unknown => {
  if (Array.isArray(nodes)) {
    return nodes.map((node) => withCreatedBlockWidthDefaults(editor, node));
  }

  if (
    !ElementApi.isElement(nodes) ||
    !editor.api.isBlock(nodes) ||
    nodes.type === PLONE_BLOCK_TYPE
  ) {
    return nodes;
  }

  return withBlockWidthDefaults(editor, nodes);
};

const setBlockWidth = (
  editor: SlateEditor,
  value: string,
  setNodesOptions?: SetNodesOptions,
) => {
  const matchesValue = (node: TElement) => {
    if (node.type === PLONE_BLOCK_TYPE) return false;

    const config = getBlockWidthConfig(editor, node);

    return isAllowedWidth(config.widths, value);
  };

  editor.tf.setNodes(
    { [BLOCK_WIDTH_KEY]: value },
    {
      match: (node) =>
        ElementApi.isElement(node) &&
        editor.api.isBlock(node) &&
        matchesValue(node),
      ...setNodesOptions,
    },
  );
};

const normalizeTopLevelBlockWidth = (
  editor: SlateEditor,
  element: TElement,
  path: number[],
) => {
  if (path.length !== 1 || element.type === PLONE_BLOCK_TYPE) {
    return false;
  }

  const currentWidth = element[BLOCK_WIDTH_KEY];
  const config = getBlockWidthConfig(editor, element);

  if (
    typeof currentWidth === 'string' &&
    isAllowedWidth(config.widths, currentWidth)
  ) {
    return false;
  }

  editor.tf.setNodes(
    {
      [BLOCK_WIDTH_KEY]: config.defaultWidth,
    },
    {
      at: path,
    },
  );

  return true;
};

export const BaseBlockWidthPlugin = createSlatePlugin({
  key: BLOCK_WIDTH_KEY,
  normalizeInitialValue: ({ editor, value }) => {
    applyBlockWidthDefaultsInValue(value, editor);
  },
  inject: {
    isBlock: true,
    nodeProps: {
      nodeKey: BLOCK_WIDTH_KEY,
      query: ({ nodeProps }) => {
        const element = nodeProps.element;

        return (
          !ElementApi.isElement(element) || element.type !== PLONE_BLOCK_TYPE
        );
      },
      transformStyle: () => ({}) as CSSStyleDeclaration,
      transformProps: ({ editor, element, nodeValue, props }) => {
        if (
          !element ||
          !ElementApi.isElement(element) ||
          element.type === PLONE_BLOCK_TYPE ||
          (editor?.api?.isBlock && !editor.api.isBlock(element)) ||
          // Block width is a top-level layout concern (see
          // `normalizeTopLevelBlockWidth`). Nested blocks, like paragraphs in
          // a blockquote, table cell or column, fill their container.
          (Array.isArray(editor?.children) &&
            !editor.children.includes(element))
        ) {
          return props;
        }

        const widthValue = getEffectiveBlockWidth(editor, element) ?? nodeValue;
        const widthStyle = getBlockWidthStyle(widthValue);

        if (!widthStyle) return props;

        return {
          ...props,
          style: {
            ...(props.style ?? {}),
            ...widthStyle,
          },
        };
      },
    },
  },
  options: {
    defaultWidths: [],
  },
  extendEditor: ({ editor }) => {
    const createBlock = editor.api.create.block.bind(editor.api.create);
    const normalizeNode =
      typeof editor.normalizeNode === 'function'
        ? editor.normalizeNode.bind(editor)
        : () => undefined;

    editor.api.create.block = ((...args: any[]) =>
      withCreatedBlockWidthDefaults(editor, createBlock(...args))) as any;

    // Every top-level block ends up with a width, however it got there
    // (typed, pasted, inserted, wrapped or lifted out of a container), so the
    // saved value is exactly what `normalizeInitialValue` produces on load.
    editor.normalizeNode = ((entry: any) => {
      const [node, path] = entry;

      if (
        ElementApi.isElement(node) &&
        PathApi.isPath(path) &&
        normalizeTopLevelBlockWidth(editor, node, path)
      ) {
        return;
      }

      normalizeNode(entry);
    }) as any;

    return editor;
  },
}).extendTransforms(({ editor }) => ({
  resetWidth: (options?: SetNodesOptions) => {
    const blockEntry = editor.api.block();
    const block =
      blockEntry &&
      ElementApi.isElement(blockEntry[0]) &&
      blockEntry[0].type !== PLONE_BLOCK_TYPE
        ? blockEntry[0]
        : undefined;
    const { defaultWidth } = getBlockWidthConfig(editor, block);

    setBlockWidth(editor, defaultWidth, options);
  },
  setWidth: (value: string, options?: SetNodesOptions) => {
    setBlockWidth(editor, value, options);
  },
}));

export const BlockWidthPlugin = toPlatePlugin(BaseBlockWidthPlugin);

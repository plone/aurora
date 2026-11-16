import {
  applyStyleFieldDefaultsInData,
  getStyleFieldsFromBlockSchema,
  getStyleFieldDefinitionsFromRegistry,
  isDeepEqual,
  PLONE_BLOCK_TYPE,
  resolveStyleFields,
  setStyleFieldValue,
  type ResolveStyleDefinitions,
} from '@plone/helpers';
import config from '@plone/registry';
import type {
  BlockConfigBase,
  BlocksFormData,
  StyleDefinition,
} from '@plone/types';
import {
  createSlatePlugin,
  ElementApi,
  PathApi,
  type Path,
  type SetNodesOptions,
  type SlateEditor,
  type TElement,
} from 'platejs';
import { toPlatePlugin } from 'platejs/react';

import { getBlockContainer } from './containers/registry';

export const STYLE_FIELDS_KEY = 'styleFields';
const DEFAULT_BLOCK_WIDTH = 'default';
type StyleFieldConfig = {
  defaultValue?: string;
  values?: readonly string[];
  path?: string;
};

type ValueElement = Record<string, unknown> & {
  type?: unknown;
  children?: unknown[];
};

// React only passes through `data-*` attributes whose suffix is lowercase, so
// camelCase field names (e.g. `blockWidth`) must be kebab-cased to avoid the
// "React does not recognize the prop" warning and end up as `data-style-block-width`.
const toKebabCase = (value: string) =>
  value.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);

const toStyleFieldDataAttributes = (values: Record<string, string>) =>
  Object.fromEntries(
    Object.entries(values).map(([fieldName, value]) => [
      `data-style-${toKebabCase(fieldName)}`,
      value,
    ]),
  );

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

/**
 * What a native Plate.js block declares in its plugin options for style
 * fields: its settings `schema`, whose fields marked `styleField: true` are
 * style fields, and its own definitions for them, by field name.
 */
export type NativeStyleFieldOptions = {
  /**
   * The settings schema, or a function that returns it. The function gets
   * `{ formData, options }`, with the plugin's options.
   */
  schema?: BlockConfigBase['blockSchema'];
  /**
   * The block's own definitions, by field name, or a function of the
   * plugin's options that returns them, so they can follow other options.
   */
  styleDefinitions?:
    | Record<string, readonly StyleDefinition[]>
    | ((
        options: Record<string, unknown>,
      ) => Record<string, readonly StyleDefinition[]>);
};

type EditorWithPlugins = Pick<SlateEditor, 'plugins'>;

const getNativeStyleFieldOptions = (
  editor: EditorWithPlugins | undefined,
  element: TElement,
): NativeStyleFieldOptions | undefined =>
  element.type === PLONE_BLOCK_TYPE
    ? undefined
    : (editor?.plugins?.[element.type]?.options as
        NativeStyleFieldOptions | undefined);

/**
 * Resolves the definitions of a style field: a native block's own
 * `styleDefinitions` first, then the registry's `styleFieldDefinition`
 * utility of the same name.
 */
export const getStyleDefinitionResolver = (
  editor: EditorWithPlugins | undefined,
  element: TElement,
): ResolveStyleDefinitions => {
  const options = getNativeStyleFieldOptions(editor, element);
  const own =
    typeof options?.styleDefinitions === 'function'
      ? options.styleDefinitions(options as Record<string, unknown>)
      : options?.styleDefinitions;
  if (!own) return getStyleFieldDefinitionsFromRegistry;
  return (fieldName, args) =>
    own[fieldName] ?? getStyleFieldDefinitionsFromRegistry(fieldName, args);
};

/** The data of the container a node is in, such as an accordion. */
const getContainerData = (
  editor: SlateEditor | undefined,
  path: Path | undefined,
): Record<string, unknown> | undefined => {
  if (!editor || !path || path.length < 2) return undefined;
  try {
    return getBlockContainer(editor, path)?.container[0] as
      Record<string, unknown> | undefined;
  } catch {
    return undefined;
  }
};

const getElementStyleFieldConfigs = (
  element?: TElement | null,
  editor?: EditorWithPlugins,
): Record<string, StyleFieldConfig> => {
  if (!element) return {};

  const native = getNativeStyleFieldOptions(editor, element);
  if (native?.schema) {
    const schema = native.schema;
    // A schema function also gets the plugin's options, so it can follow
    // them, such as a list of themes.
    const blockSchema =
      typeof schema === 'function'
        ? (args: Record<string, unknown>) =>
            (schema as (args: Record<string, unknown>) => unknown)({
              ...args,
              options: native,
            })
        : schema;
    return getStyleFieldsFromBlockSchema(
      { blockSchema: blockSchema as BlockConfigBase['blockSchema'] },
      element as unknown as BlocksFormData,
    );
  }

  if (element.type === PLONE_BLOCK_TYPE) {
    const blockType = (element as TElement & { '@type'?: unknown })['@type'];

    if (typeof blockType !== 'string') return {};

    const blockConfig = (config.blocks as Record<string, unknown>)
      .blocksConfig as Record<string, BlockConfigBase> | undefined;

    const currentBlockConfig = blockConfig?.[blockType];
    const styleFields = getStyleFieldsFromBlockSchema(
      currentBlockConfig,
      element as unknown as BlocksFormData,
    );

    return {
      ...styleFields,
      blockWidth: styleFields.blockWidth ?? {
        defaultValue:
          currentBlockConfig?.defaultBlockWidth ?? DEFAULT_BLOCK_WIDTH,
      },
    };
  }

  return {};
};

const applyStyleFieldDefaultsToElement = <T extends TElement>(
  element: T,
  editor?: SlateEditor,
  path?: Path,
): T => {
  const fieldConfigs = getElementStyleFieldConfigs(element, editor);
  const nextElement = { ...element } as Record<string, unknown>;
  const nextStyles = nextElement['styles'];

  if (isRecord(nextStyles)) {
    nextElement['styles'] = { ...nextStyles };
  }

  applyStyleFieldDefaultsInData({
    data: nextElement,
    fieldConfigs,
    container: getContainerData(editor, path),
    resolveDefinitions: getStyleDefinitionResolver(editor, element),
  });

  return nextElement as T;
};

const withInsertedStyleFieldDefaults = (nodes: unknown): unknown => {
  if (Array.isArray(nodes)) {
    return nodes.map((node) => withInsertedStyleFieldDefaults(node));
  }

  if (!ElementApi.isElement(nodes)) {
    return nodes;
  }

  return applyStyleFieldDefaultsToElement(nodes);
};

/**
 * Applies the style field defaults to a top-level Plone block, or to a
 * native block with a settings schema at any depth. Block width only
 * applies at the top level.
 */
const normalizeStyleFields = (
  editor: SlateEditor,
  element: TElement,
  path: number[],
) => {
  const isTopLevelPloneBlock =
    path.length === 1 && element.type === PLONE_BLOCK_TYPE;
  const isNativeWithSchema = !!getNativeStyleFieldOptions(editor, element)
    ?.schema;
  if (!isTopLevelPloneBlock && !isNativeWithSchema) return false;

  const nextElement = applyStyleFieldDefaultsToElement(
    element,
    editor,
    path,
  ) as Record<string, unknown>;
  if (path.length > 1) delete nextElement.blockWidth;
  const patch = Object.fromEntries(
    Object.entries(nextElement).filter(
      ([key, value]) =>
        key !== 'children' &&
        !isDeepEqual((element as Record<string, unknown>)[key], value),
    ),
  );

  if (!Object.keys(patch).length) return false;

  editor.tf.setNodes(patch, { at: path });

  return true;
};

const applyStyleFieldDefaultsInValue = (value: unknown[]) => {
  const applyDefaults = (node: unknown) => {
    if (!node || typeof node !== 'object') return;

    const element = node as ValueElement;
    if (typeof element.type !== 'string') return;

    if (isRecord(element.styles)) {
      element.styles = { ...element.styles };
    }

    applyStyleFieldDefaultsInData({
      data: element,
      fieldConfigs: getElementStyleFieldConfigs(element as TElement),
      container: undefined,
      resolveDefinitions: getStyleFieldDefinitionsFromRegistry,
    });
  };

  value.forEach(applyDefaults);
  return value;
};

const buildStyleFieldPatch = (
  node: TElement,
  fieldName: string,
  value: string,
  fieldConfig?: StyleFieldConfig,
) => {
  const nextNode = { ...node } as TElement & Record<string, unknown>;

  if (isRecord(nextNode.styles)) {
    nextNode.styles = { ...nextNode.styles };
  }

  setStyleFieldValue(nextNode, fieldName, value, fieldConfig);

  if (
    typeof fieldConfig?.path === 'string' &&
    fieldConfig.path.startsWith('styles.')
  ) {
    return {
      styles: nextNode.styles,
    };
  }

  if (!(fieldName in node) && isRecord(node.styles)) {
    return {
      styles: nextNode.styles,
    };
  }

  return {
    [fieldName]: nextNode[fieldName],
  };
};

export const setStyleFieldOnEditor = (
  editor: SlateEditor,
  fieldName: string,
  value: string,
  setNodesOptions?: SetNodesOptions,
) => {
  const entries = setNodesOptions?.at
    ? [editor.api.node<TElement>(setNodesOptions.at)].filter(Boolean)
    : editor.api.blocks({ mode: 'lowest' });

  entries.forEach((entry) => {
    if (!entry) return;

    const [node, path] = entry;

    if (!ElementApi.isElement(node) || !editor.api.isBlock(node)) return;

    const fieldConfig = getElementStyleFieldConfigs(node, editor)[fieldName];
    const definitions = getStyleDefinitionResolver(editor, node)(fieldName, {
      data: node as Record<string, unknown>,
      blockType:
        (typeof node.type === 'string' && node.type !== PLONE_BLOCK_TYPE
          ? node.type
          : (node as TElement & { '@type'?: string })['@type']) ?? undefined,
      fieldName,
    });

    const allowedValues = fieldConfig?.values?.length
      ? fieldConfig.values
      : definitions
          .map((definition: { name?: string }) => definition.name)
          .filter((name: string | undefined): name is string => !!name);

    if (!allowedValues.includes(value)) return;

    editor.tf.setNodes(
      buildStyleFieldPatch(node, fieldName, value, fieldConfig),
      {
        ...setNodesOptions,
        at: path,
      },
    );
  });
};

export const resetStyleFieldOnEditor = (
  editor: SlateEditor,
  fieldName: string,
  options?: SetNodesOptions,
) => {
  const blockEntry = editor.api.block();
  const block =
    blockEntry && ElementApi.isElement(blockEntry[0])
      ? blockEntry[0]
      : undefined;
  const defaultValue = block
    ? getElementStyleFieldConfigs(block, editor)[fieldName]?.defaultValue
    : undefined;

  if (!defaultValue) return;

  setStyleFieldOnEditor(editor, fieldName, defaultValue, options);
};

/**
 * The CSS custom properties and the values of an element's style fields,
 * with the data of the container it's in.
 */
export const getElementStyleFields = (
  editor: SlateEditor | undefined,
  element: TElement,
) => {
  const fieldConfigs = getElementStyleFieldConfigs(element, editor);
  if (!Object.keys(fieldConfigs).length) return { style: {}, values: {} };

  let path: Path | undefined;
  try {
    path = editor?.api.findPath(element);
  } catch {
    path = undefined;
  }
  return resolveStyleFields({
    data: element as Record<string, unknown>,
    fieldConfigs,
    container: getContainerData(editor, path),
    resolveDefinitions: getStyleDefinitionResolver(editor, element),
  });
};

export const BaseStyleFieldsPlugin = createSlatePlugin({
  key: STYLE_FIELDS_KEY,
  normalizeInitialValue: ({ value }) => {
    applyStyleFieldDefaultsInValue(value);
  },
  inject: {
    isBlock: true,
    nodeProps: {
      transformProps: ({ editor, element, props }) => {
        if (!element || !ElementApi.isElement(element)) {
          return props;
        }

        const { style, values } = getElementStyleFields(
          editor as SlateEditor,
          element,
        );

        const dataAttributes = toStyleFieldDataAttributes(values);

        if (!Object.keys(style).length && !Object.keys(dataAttributes).length) {
          return props;
        }

        return {
          ...props,
          ...dataAttributes,
          style: {
            ...(props.style ?? {}),
            ...style,
          },
        };
      },
    },
  },
  extendEditor: ({ editor }) => {
    const createBlock = editor.api.create.block.bind(editor.api.create);
    const normalizeNode =
      typeof editor.normalizeNode === 'function'
        ? editor.normalizeNode.bind(editor)
        : () => undefined;

    editor.api.create.block = ((...args: any[]) =>
      withInsertedStyleFieldDefaults(createBlock(...args))) as any;

    // Top-level Plone blocks, and native blocks with a settings schema,
    // always carry their style field defaults, however they got there, so
    // the saved value is exactly what loading it produces.
    editor.normalizeNode = ((entry: any) => {
      const [node, path] = entry;

      if (
        ElementApi.isElement(node) &&
        PathApi.isPath(path) &&
        normalizeStyleFields(editor, node, path)
      ) {
        return;
      }

      normalizeNode(entry);
    }) as any;

    return editor;
  },
}).extendTransforms(({ editor }) => ({
  setStyleField: (
    fieldName: string,
    value: string,
    options?: SetNodesOptions,
  ) => {
    setStyleFieldOnEditor(editor, fieldName, value, options);
  },
  resetStyleField: (fieldName: string, options?: SetNodesOptions) => {
    resetStyleFieldOnEditor(editor, fieldName, options);
  },
}));

export const StyleFieldsPlugin = toPlatePlugin(BaseStyleFieldsPlugin);

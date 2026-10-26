import { applySchemaEnhancer } from '@plone/helpers';
import type { BlockConfigBase, BlocksFormData, JSONSchema } from '@plone/types';

/**
 * A `*.block.md` file, as collected by `@plone/registry` at build time.
 */
export type BlockDocsFile = {
  block?: string;
  variation?: string;
  /** A native element of the page document, like a Plate `callout`. */
  element?: string;
  title?: string;
  markdown: string;
};

/**
 * What a page is made of: `block`, a Plone block from `blocksConfig`, stored
 * as a `ploneBlock` node, or `element`, a native Plate element of the
 * document, stored as a node of its `type`.
 */
export type NodeKind = 'block' | 'element';

export type BlockSummary = {
  id: string;
  title: string;
  kind: NodeKind;
  description?: string;
  restricted?: boolean | 'context';
};

export type VariationDetail = {
  id: string;
  title: string;
  isDefault: boolean;
  docs?: string;
  schema: JSONSchema | null;
  error?: string;
};

export type BlockDetail = {
  id: string;
  title: string;
  kind: 'block';
  docs: string;
  schema: JSONSchema | null;
  error?: string;
  variations?: VariationDetail[];
  restricted?: boolean | 'context';
};

export type ElementDetail = {
  id: string;
  title: string;
  kind: 'element';
  docs: string;
};

/**
 * The block ID whose docs describe the format of the page document, a Plate
 * value stored in one block of the content, instead of a block.
 */
export const DOCUMENT_DOCS_ID = '__somersault__';

const SCHEMA_ERROR = 'The schema for this block could not be resolved.';

/**
 * Schemas may hold values that are not JSON: widget components, React
 * elements, function defaults or validators. Drops them, and cuts cycles, so
 * the response only carries the serializable part of the schema.
 */
export function toJSONSafe(
  value: unknown,
  ancestors: WeakSet<object> = new WeakSet(),
): unknown {
  if (value === null) return null;
  if (typeof value === 'function' || typeof value === 'symbol') {
    return undefined;
  }
  if (typeof value !== 'object') return value;
  if ('$$typeof' in value) return undefined;
  if (typeof (value as { toJSON?: unknown }).toJSON === 'function') {
    return (value as { toJSON: () => unknown }).toJSON();
  }
  if (ancestors.has(value)) return undefined;

  ancestors.add(value);
  let result: unknown;
  if (Array.isArray(value)) {
    result = value
      .map((item) => toJSONSafe(item, ancestors))
      .filter((item) => item !== undefined);
  } else {
    const safe: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) {
      const safeItem = toJSONSafe(item, ancestors);
      if (safeItem !== undefined) safe[key] = safeItem;
    }
    result = safe;
  }
  ancestors.delete(value);
  return result;
}

function resolveSchema(
  blockConfig: BlockConfigBase,
  variation?: string,
): JSONSchema | null {
  const { blockSchema, id } = blockConfig;
  if (!blockSchema) return null;

  const formData = (
    variation ? { '@type': id, variation } : { '@type': id }
  ) as BlocksFormData;
  // The same arguments as the block settings form.
  const schema =
    typeof blockSchema === 'function'
      ? blockSchema({
          formData,
          data: formData,
          props: { data: formData } as any,
        })
      : blockSchema;
  if (!schema) return null;

  // Same enhancer chain as the block settings form: the selected (or default)
  // variation's schemaEnhancer, then the block's own schemaEnhancer.
  return applySchemaEnhancer({
    schema,
    formData,
    blocksConfig: { [id]: blockConfig },
  });
}

// A schema that fails to resolve (for example an add-on schema that expects
// props only available in the editor) must not break the whole response.
function withSchema<T extends object>(
  target: T,
  blockConfig: BlockConfigBase,
  variation?: string,
): T & { schema: JSONSchema | null; error?: string } {
  const result = target as T & { schema: JSONSchema | null; error?: string };
  try {
    result.schema = toJSONSafe(
      resolveSchema(blockConfig, variation),
    ) as JSONSchema | null;
  } catch (e) {
    const name = variation ? `${blockConfig.id}/${variation}` : blockConfig.id;
    // eslint-disable-next-line no-console
    console.error(
      `[blocks-schema] Could not resolve the schema for '${name}':`,
      e,
    );
    result.schema = null;
    result.error = SCHEMA_ERROR;
  }
  return result;
}

const FRONTMATTER = /^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/;
const PLACEHOLDER = /(\\?)\{\{\s*([A-Za-z_$][\w$]*)\s*\}\}/g;

/**
 * Replaces `{{key}}` in a block's docs with that key of its configuration,
 * so the docs can say what the configuration allows. `\{{key}}` is literal.
 */
export function fillPlaceholders(
  markdown: string,
  blockConfig: Record<string, unknown>,
  name = String(blockConfig.id),
): string {
  return markdown.replace(PLACEHOLDER, (match, escaped, key) => {
    if (escaped) return match.slice(1);
    const value = blockConfig[key];
    if (Array.isArray(value)) {
      return value.map((item) => `\`${item}\``).join(', ');
    }
    if (['string', 'number', 'boolean'].includes(typeof value)) {
      return String(value);
    }
    // eslint-disable-next-line no-console
    console.warn(
      `[blocks-schema] The docs of '${name}' use {{${key}}}, which the block configuration doesn't have as a value.`,
    );
    return '';
  });
}

function getDocsFile(
  docsFiles: BlockDocsFile[],
  block: string,
  variation?: string,
): string {
  const file = docsFiles.find(
    (item) => item.block === block && item.variation === variation,
  );
  return file ? file.markdown.replace(FRONTMATTER, '') : '';
}

/**
 * The docs of the page document format, from the `*.block.md` file that
 * names `__somersault__`.
 */
export function getDocumentDocs(docsFiles: BlockDocsFile[]): string {
  return getDocsFile(docsFiles, DOCUMENT_DOCS_ID).trim();
}

/**
 * The docs of a block, or of one of its variations, from its `*.block.md`
 * file. A block's `docs` function can tailor them.
 */
export function resolveDocs(
  docsFiles: BlockDocsFile[],
  blockConfig: BlockConfigBase,
  variation?: string,
): string {
  const name = variation ? `${blockConfig.id}/${variation}` : blockConfig.id;
  const markdown = fillPlaceholders(
    getDocsFile(docsFiles, blockConfig.id, variation),
    blockConfig as unknown as Record<string, unknown>,
    name,
  ).trim();

  if (variation || typeof blockConfig.docs !== 'function') return markdown;
  try {
    const tailored = blockConfig.docs({ blockConfig, markdown });
    return typeof tailored === 'string' ? tailored.trim() : markdown;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(`[blocks-schema] docs() for '${name}' threw:`, e);
    return markdown;
  }
}

/**
 * The first paragraph of the docs is the block's summary.
 */
export function getSummary(markdown: string): string {
  const [first = ''] = markdown.split(/\n\s*\n/);
  return first.replace(/\s*\n\s*/g, ' ').trim();
}

export function buildSummaryItem(
  docsFiles: BlockDocsFile[],
  blockConfig: BlockConfigBase,
): BlockSummary {
  const item: BlockSummary = {
    id: blockConfig.id,
    title: blockConfig.title,
    kind: 'block',
  };
  const description = getSummary(resolveDocs(docsFiles, blockConfig));
  if (description) {
    item.description = description;
  }
  return item;
}

export function buildFullDetail(
  docsFiles: BlockDocsFile[],
  blockConfig: BlockConfigBase,
): BlockDetail {
  const result: BlockDetail = withSchema(
    {
      id: blockConfig.id,
      title: blockConfig.title,
      kind: 'block' as const,
      docs: resolveDocs(docsFiles, blockConfig),
    },
    blockConfig,
  );

  if (blockConfig.variations?.length) {
    result.variations = blockConfig.variations.map((variation) => {
      const item: Omit<VariationDetail, 'schema'> = {
        id: variation.id,
        title: variation.title,
        isDefault: Boolean(variation.isDefault),
      };
      const docs = resolveDocs(docsFiles, blockConfig, variation.id);
      if (docs) {
        item.docs = docs;
      }
      return withSchema(item, blockConfig, variation.id);
    });
  }

  return result;
}

/**
 * The documented elements of the page document, in the order of their docs
 * files. Their placeholders are filled from their `plateBlocksConfig` entry.
 */
export function getElements(
  docsFiles: BlockDocsFile[],
  plateBlocksConfig: Record<string, object> = {},
): ElementDetail[] {
  return docsFiles
    .filter((file): file is BlockDocsFile & { element: string } =>
      Boolean(file.element),
    )
    .map(({ element, title, markdown }) => ({
      id: element,
      title: title || element,
      kind: 'element' as const,
      docs: fillPlaceholders(
        markdown.replace(FRONTMATTER, ''),
        { id: element, ...plateBlocksConfig[element] },
        element,
      ).trim(),
    }));
}

export function elementSummary({
  docs,
  ...element
}: ElementDetail): BlockSummary {
  const description = getSummary(docs);
  return description ? { ...element, description } : element;
}

/**
 * In the list of all blocks, a block is flagged as restricted when it's
 * never offered, or as `'context'` when that depends on the content.
 */
export function restrictedFlag(
  blockConfig: BlockConfigBase,
): true | 'context' | undefined {
  if (typeof blockConfig.restricted === 'function') return 'context';
  return blockConfig.restricted ? true : undefined;
}

/**
 * Markdown is returned for `?format=md`, or when the client asks for
 * `text/markdown` and not for JSON. JSON stays the default.
 */
export function wantsMarkdown(request: Request): boolean {
  if (new URL(request.url).searchParams.get('format') === 'md') return true;
  const accept = request.headers.get('Accept') || '';
  return (
    accept.includes('text/markdown') && !accept.includes('application/json')
  );
}

const jsonBlock = (value: unknown) =>
  ['```json', JSON.stringify(value, null, 2), '```'].join('\n');

const MARKDOWN_SCHEMA_ERROR = `_${SCHEMA_ERROR}_`;

/**
 * One `##` section per block: its docs (which use `###` headings), its
 * variations, and its schema. A variation's schema is only listed when it
 * differs from the block's schema.
 */
export function blockToMarkdown(
  detail: BlockSummary | BlockDetail | ElementDetail,
): string {
  const { docs, schema, error, variations, restricted } =
    detail as Partial<BlockDetail>;
  const parts = [
    `## ${detail.title} (\`${detail.id}\`)`,
    detail.kind === 'element'
      ? `_An element of the document: a node with \`"type": "${detail.id}"\`._`
      : `_A Plone block: a \`ploneBlock\` node with \`"@type": "${detail.id}"\`._`,
  ];

  if (restricted === true) {
    parts.push('_Not offered in the block chooser._');
  } else if (restricted === 'context') {
    parts.push(
      '_Whether it is offered in the block chooser depends on the content. Ask `/<path>/@blocks-schema` for a given content item._',
    );
  }

  if (docs) parts.push(docs);

  if (variations?.length) {
    const items = variations.map((variation) => {
      const item = `- \`${variation.id}\`: ${variation.title}${
        variation.isDefault ? ' (default)' : ''
      }`;
      return variation.docs
        ? `${item}\n\n${variation.docs.replace(/^(?=.)/gm, '  ')}`
        : item;
    });
    parts.push('### Variations', items.join('\n'));
  }

  if (schema || error) {
    parts.push('### Schema', error ? MARKDOWN_SCHEMA_ERROR : jsonBlock(schema));
  }

  const blockSchema = JSON.stringify(schema);
  for (const variation of variations || []) {
    if (variation.error) {
      parts.push(`### Schema for \`${variation.id}\``, MARKDOWN_SCHEMA_ERROR);
    } else if (
      variation.schema &&
      JSON.stringify(variation.schema) !== blockSchema
    ) {
      parts.push(
        `### Schema for \`${variation.id}\``,
        jsonBlock(variation.schema),
      );
    }
  }

  return parts.join('\n\n');
}

/**
 * One Markdown document: an introduction, the format of the page document
 * (when documented), and a section per block.
 */
export function blocksToMarkdown(
  details: Array<BlockSummary | BlockDetail | ElementDetail>,
  documentDocs = '',
): string {
  return (
    [
      '# Blocks',
      'The elements and blocks available on this site to build a page, with their documentation and the schema of their settings.',
      ...(documentDocs ? ['## Document format', documentDocs] : []),
      ...details.map(blockToMarkdown),
    ].join('\n\n') + '\n'
  );
}

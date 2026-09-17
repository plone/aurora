import {
  data,
  redirect,
  RouterContextProvider,
  useLoaderData,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from 'react-router';
import { useTranslation } from 'react-i18next';
import { flattenToAppURL, hasBlocksData } from '@plone/helpers';
import { requireAuthCookie } from '@plone/react-router';
import type { Content } from '@plone/types';
import {
  ploneClientContext,
  ploneContentContext,
} from '@plone/aurora/app/middleware.server';
import RenderBlocks from '@plone/layout/blocks/RenderBlocks';
import config from '@plone/registry';
import ContentForm from '../components/ContentForm/ContentForm';

const SERVER_MANAGED_KEYS = [
  '@id',
  '@components',
  'UID',
  'id',
  'review_state',
  'is_folderish',
  'parent',
];

function stripServerKeys(content: Record<string, unknown>) {
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(content)) {
    if (!SERVER_MANAGED_KEYS.includes(key)) clean[key] = value;
  }
  return clean;
}

const TEXT_NODE_TYPES = [
  'title',
  'description',
  'p',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'blockquote',
  'ul',
  'ol',
  'li',
  'lic',
  'a',
  'code',
  'pre',
];

const TEXT_BLOCK_TYPES = ['slate', 'text', 'title', 'description'];

type PlateNode = { type?: string; children?: unknown } & Record<
  string,
  unknown
>;

function placeholderValueNodes(nodes: unknown): unknown {
  if (!Array.isArray(nodes)) return nodes;
  return nodes.map((node) => {
    if (!node || typeof node !== 'object' || Array.isArray(node)) return node;
    const plateNode = node as PlateNode;
    const type = plateNode.type;
    if (type && !TEXT_NODE_TYPES.includes(type) && !('text' in plateNode)) {
      // Without the adapted block's '@type', the block adapter renders nothing.
      return {
        type,
        ...(typeof plateNode.id === 'string' ? { id: plateNode.id } : {}),
        ...(typeof plateNode['@type'] === 'string'
          ? { '@type': plateNode['@type'] }
          : {}),
        children: [{ text: '' }],
      };
    }
    return {
      ...plateNode,
      ...(Array.isArray(plateNode.children)
        ? { children: placeholderValueNodes(plateNode.children) }
        : {}),
    };
  });
}

function hasVisibleNodes(nodes: unknown): boolean {
  if (!Array.isArray(nodes)) return false;
  return nodes.some((node) => {
    if (!node || typeof node !== 'object') return false;
    const plateNode = node as PlateNode;
    if (typeof plateNode.text === 'string' && plateNode.text.trim())
      return true;
    if (typeof plateNode['@type'] === 'string') return true;
    return hasVisibleNodes(plateNode.children);
  });
}

// The middleware migrates all content to a somersault block, even empty one,
// so block presence alone proves nothing.
function hasVisibleSourceBlocks(source: Content): boolean {
  const blocks = (source.blocks ?? {}) as Record<
    string,
    { value?: unknown } | undefined
  >;
  const somersault = blocks.__somersault__;
  if (somersault) return hasVisibleNodes(somersault.value);
  return hasBlocksData(source) && Object.keys(blocks).length > 0;
}

function placeholderBlocks(blocks: Record<string, unknown>) {
  const clean: Record<string, unknown> = {};
  for (const [id, block] of Object.entries(blocks)) {
    const blockData = (block ?? {}) as Record<string, unknown>;
    const type = blockData['@type'] as string | undefined;
    if (type === '__somersault__') {
      clean[id] = {
        ...blockData,
        value: placeholderValueNodes(blockData.value),
      };
    } else if (type && TEXT_BLOCK_TYPES.includes(type)) {
      clean[id] = blockData;
    } else {
      clean[id] = { '@type': type };
    }
  }
  return clean;
}

export async function loader({
  request,
  context,
}: LoaderFunctionArgs<RouterContextProvider>) {
  await requireAuthCookie(request);

  const cli = context.get(ploneClientContext);
  const source = context.get(ploneContentContext);
  const sourcePath = flattenToAppURL(source['@id']);

  const targetLanguage =
    new URL(request.url).searchParams.get('language') || '';

  let schema;
  let translations;
  try {
    [{ data: schema }, { data: translations }] = await Promise.all([
      cli.getType({ type: source['@type'] }),
      cli.getTranslation({ path: sourcePath }),
    ]);
  } catch {
    // eg. content outside a language root
    throw data('Content is not translatable', { status: 400 });
  }

  if (!targetLanguage || !(translations.root ?? {})[targetLanguage]) {
    throw data('Unknown target language', { status: 400 });
  }

  const existing = (translations.items ?? []).find(
    (item) => item.language === targetLanguage,
  );
  if (existing) {
    throw redirect(`/@@edit${flattenToAppURL(existing['@id'])}`);
  }

  const initial = {
    '@type': source['@type'],
    title: '',
    blocks: placeholderBlocks((source.blocks ?? {}) as Record<string, unknown>),
    blocks_layout: source.blocks_layout ?? { items: [] },
  } as unknown as Content;

  return data(
    flattenToAppURL({
      source,
      schema,
      initial,
      targetLanguage,
    }),
  );
}

export async function action({
  request,
  params,
  context,
}: ActionFunctionArgs<RouterContextProvider>) {
  await requireAuthCookie(request);

  const cli = context.get(ploneClientContext);
  const source = context.get(ploneContentContext);
  const sourcePath = `/${params['*'] || ''}`;
  const targetLanguage =
    new URL(request.url).searchParams.get('language') || '';

  const formData = (await request.json()) as Record<string, unknown>;

  const { data: translations } = await cli.getTranslation({
    path: sourcePath,
  });
  const existing = (translations.items ?? []).find(
    (item) => item.language === targetLanguage,
  );

  if (existing) {
    const translationPath = flattenToAppURL(existing['@id']);
    await cli.updateContent({
      path: translationPath,
      data: stripServerKeys(formData),
    });
    return redirect(`/@@edit${translationPath}`);
  }

  const targetRoot = flattenToAppURL(
    (translations.root ?? {})[targetLanguage] ?? '',
  );
  if (!targetLanguage || !targetRoot) {
    throw data('Unknown target language', { status: 400 });
  }
  const created = await cli.createContent({
    path: targetRoot,
    data: {
      ...stripServerKeys(formData),
      '@type': source['@type'],
      language: targetLanguage,
    } as any,
  });
  const translationPath = flattenToAppURL(created.data['@id']);
  await cli.linkTranslation({
    path: sourcePath,
    data: { id: translationPath },
  });

  return redirect(`/@@edit${translationPath}`);
}

export default function Translate() {
  const { source, schema, initial, targetLanguage } =
    useLoaderData<typeof loader>();
  const { t } = useTranslation();

  const sourceLanguage =
    typeof source.language === 'string'
      ? source.language
      : ((source.language as { token?: string } | undefined)?.token ?? '—');

  const fieldPlaceholders: Record<string, string> = {};
  for (const [field, value] of Object.entries(source)) {
    if (typeof value === 'string' && value && field in schema.properties) {
      fieldPlaceholders[field] = value;
    }
  }

  return (
    <ContentForm
      content={initial}
      schema={schema}
      fieldPlaceholders={fieldPlaceholders}
      asidePanels={{
        header: (
          <p className="text-quanta-graphite text-sm font-bold uppercase">
            {t('cmsui.translate.source')} ({sourceLanguage}) —{' '}
            <a
              href={source['@id']}
              className="text-quanta-sapphire normal-case"
              target="_blank"
              rel="noreferrer"
            >
              {t('cmsui.translate.view_source')}
            </a>
          </p>
        ),
        blocks: hasVisibleSourceBlocks(source) ? (
          <RenderBlocks
            content={source}
            blocksConfig={config.blocks.blocksConfig}
            pathname={source['@id']}
          />
        ) : (
          <>
            <h1 className="text-2xl font-bold">{source.title}</h1>
            {source.description && (
              <p className="text-quanta-graphite mt-2">{source.description}</p>
            )}
          </>
        ),
        content: (
          <dl>
            {schema.fieldsets.flatMap((fieldset) =>
              fieldset.fields
                .filter(
                  (field) =>
                    !['blocks', 'blocks_layout', 'changeNote'].includes(
                      field,
                    ) && formatValue(source[field as keyof Content]),
                )
                .map((field) => (
                  <div key={field} className="mb-3">
                    <dt className="text-quanta-graphite text-sm font-bold">
                      {schema.properties[field]?.title ?? field}
                    </dt>
                    <dd>{formatValue(source[field as keyof Content])}</dd>
                  </div>
                )),
            )}
          </dl>
        ),
      }}
      heading={t('cmsui.translate.heading_new', {
        title: source.title,
        language: targetLanguage,
      })}
      submitMethod="post"
    />
  );
}

function formatValue(value: unknown): string {
  if (value == null || value === '') return '';
  if (typeof value === 'boolean') return value ? '✓' : '';
  if (Array.isArray(value)) {
    return value
      .map((item) => formatValue(item))
      .filter(Boolean)
      .join(', ');
  }
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return String(record.title ?? record.token ?? '');
  }
  return String(value);
}

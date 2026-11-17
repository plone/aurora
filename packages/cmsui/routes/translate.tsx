import {
  data,
  redirect,
  RouterContextProvider,
  useLoaderData,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from 'react-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { flattenToAppURL, hasBlocksData } from '@plone/helpers';
import { requireAuthCookie } from '@plone/react-router';
import type { Content } from '@plone/types';
import {
  ploneClientContext,
  ploneContentContext,
} from '@plone/aurora/app/middleware.server';
import RenderBlocks from '@plone/layout/blocks/RenderBlocks';
import ContentForm from '../components/ContentForm/ContentForm';
import { getServerValidationErrors } from '../components/Form/validation';
import { getTranslationsOrThrow } from '../helpers/translations.server';

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

function contentLanguage(content: Content): string {
  const language = content.language as { token?: string } | string | undefined;
  return typeof language === 'string' ? language : (language?.token ?? '');
}

// Own keys only: a `?language=__proto__` must not resolve to a root.
function targetRootOf(
  translations: { root?: Record<string, string> },
  language: string,
): string | undefined {
  const root = translations.root ?? {};
  return language && Object.hasOwn(root, language) ? root[language] : undefined;
}

function validTargetLanguage(source: Content, targetLanguage: string) {
  return targetLanguage !== '' && targetLanguage !== contentLanguage(source);
}

const conflict = () =>
  data(
    { error: 'A translation in this language already exists' },
    { status: 409 },
  );

// plone.app.multilingual raises `KeyError('Translation already exists')`.
function isTranslationExistsError(error: unknown) {
  const { data: body } = (error ?? {}) as {
    data?: { type?: unknown; message?: unknown };
  };
  return (
    body?.type === 'KeyError' &&
    typeof body.message === 'string' &&
    body.message.includes('Translation already exists')
  );
}

export async function loader({
  request,
  context,
}: LoaderFunctionArgs<RouterContextProvider>) {
  await requireAuthCookie(request);

  const cli = context.get(ploneClientContext);
  const source = context.get(ploneContentContext);

  const targetLanguage =
    new URL(request.url).searchParams.get('language') || '';

  const [{ data: schema }, translations] = await Promise.all([
    cli.getType({ type: source['@type'] }),
    getTranslationsOrThrow(cli, source),
  ]);

  const targetRoot = targetRootOf(translations, targetLanguage);
  if (!validTargetLanguage(source, targetLanguage) || !targetRoot) {
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
      targetRoot,
    }),
  );
}

export async function action({
  request,
  context,
}: ActionFunctionArgs<RouterContextProvider>) {
  await requireAuthCookie(request);

  const cli = context.get(ploneClientContext);
  const source = context.get(ploneContentContext);
  const targetLanguage =
    new URL(request.url).searchParams.get('language') || '';

  const formData = (await request.json()) as Record<string, unknown>;

  const translations = await getTranslationsOrThrow(cli, source);
  const targetRoot = targetRootOf(translations, targetLanguage);
  if (!validTargetLanguage(source, targetLanguage) || !targetRoot) {
    throw data('Unknown target language', { status: 400 });
  }

  // The backend rejects a duplicate too (rolling back the create), but as a
  // 503 KeyError we could only recognise by its message. We already have the
  // translations here, so catch the common case cleanly and leave the message
  // match below for a translation created in the meantime.
  if (
    (translations.items ?? []).some((item) => item.language === targetLanguage)
  ) {
    return conflict();
  }

  // `translation_of` creates and links in one request: if linking fails, the
  // backend rolls back the create, leaving no unlinked copy behind.
  let created;
  try {
    created = await cli.createContent({
      path: flattenToAppURL(targetRoot),
      data: {
        ...stripServerKeys(formData),
        '@type': source['@type'],
        language: targetLanguage,
        translation_of: source.UID,
      } as any,
    });
  } catch (error) {
    const errors = getServerValidationErrors(error);
    if (errors) return data({ errors }, { status: 400 });
    if (isTranslationExistsError(error)) return conflict();
    throw error;
  }

  return redirect(`/@@edit${flattenToAppURL(created.data['@id'])}`);
}

export default function Translate() {
  const { source, schema, initial, targetLanguage, targetRoot } =
    useLoaderData<typeof loader>();
  const { t } = useTranslation();

  const sourceLanguage = contentLanguage(source) || '—';

  const fieldPlaceholders = useMemo(() => {
    const placeholders: Record<string, string> = {};
    for (const [field, value] of Object.entries(source)) {
      if (typeof value === 'string' && value && field in schema.properties) {
        placeholders[field] = value;
      }
    }
    return placeholders;
  }, [source, schema]);

  return (
    <ContentForm
      // A new form store for each source and target language.
      key={`${source['@id']}?language=${targetLanguage}`}
      content={initial}
      path={targetRoot}
      cancelHref={source['@id']}
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
          <RenderBlocks content={source} />
        ) : (
          <>
            <h2 className="text-2xl font-bold">{source.title}</h2>
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

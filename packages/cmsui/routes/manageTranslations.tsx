import { useEffect, useState } from 'react';
import {
  data,
  Link,
  RouterContextProvider,
  useFetcher,
  useLoaderData,
  useNavigate,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from 'react-router';
import { useTranslation } from 'react-i18next';
import { flattenToAppURL, langmap } from '@plone/helpers';
import { requireAuthCookie } from '@plone/react-router';
import type { Brain } from '@plone/types';
import config from '@plone/registry';
import {
  ploneClientContext,
  ploneContentContext,
} from '@plone/aurora/app/middleware.server';
import { Plug } from '@plone/layout/components/Pluggable';
import { type ToastItem } from '@plone/layout/config/toast';
import {
  Button,
  Cell,
  Column,
  Container,
  Row,
  Table,
  TableBody,
  TableHeader,
} from '@plone/components/quanta';
import { AddIcon, LanguageIcon, LinkIcon } from '@plone/components/Icons';
import Back from '@plone/components/icons/arrow-left.svg?react';
import { ObjectBrowserProvider } from '../components/ObjectBrowserWidget/ObjectBrowserContext';
import { ObjectBrowserModal } from '../components/ObjectBrowserWidget/ObjectBrowserModal';

export async function loader({
  request,
  context,
}: LoaderFunctionArgs<RouterContextProvider>) {
  await requireAuthCookie(request);

  const cli = context.get(ploneClientContext);
  const content = context.get(ploneContentContext);
  const contentPath = flattenToAppURL(content['@id']);

  let translations;
  try {
    ({ data: translations } = await cli.getTranslation({ path: contentPath }));
  } catch {
    throw data('Content is not translatable', { status: 400 });
  }

  const language = content.language as { token?: string } | string | undefined;
  const contentLanguage =
    typeof language === 'string' ? language : (language?.token ?? '');

  const linked = new Map(
    (translations.items ?? []).map((item) => [
      item.language,
      flattenToAppURL(item['@id']),
    ]),
  );

  const rows = Object.keys(translations.root ?? {})
    .sort(
      (a, b) =>
        Number(b === contentLanguage) - Number(a === contentLanguage) ||
        a.localeCompare(b),
    )
    .map((lang) => ({
      language: lang,
      isCurrent: lang === contentLanguage,
      translationPath:
        lang === contentLanguage ? contentPath : (linked.get(lang) ?? null),
      rootPath: flattenToAppURL(translations.root[lang]),
    }));

  return { title: content.title, contentPath, rows };
}

type ActionBody =
  | { intent: 'link'; target: string }
  | { intent: 'unlink'; language: string };

export async function action({
  request,
  context,
}: ActionFunctionArgs<RouterContextProvider>) {
  await requireAuthCookie(request);

  const cli = context.get(ploneClientContext);
  const content = context.get(ploneContentContext);
  const contentPath = flattenToAppURL(content['@id']);
  const body = (await request.json()) as ActionBody;

  try {
    if (body.intent === 'link') {
      await cli.linkTranslation({
        path: contentPath,
        data: { id: body.target },
      });
    } else if (body.intent === 'unlink') {
      await cli.unlinkTranslation({
        path: contentPath,
        data: { language: body.language },
      });
    } else {
      return data(
        { ok: false as const, error: 'Unknown intent' },
        { status: 400 },
      );
    }
  } catch (e) {
    const err = e as {
      status?: number;
      data?: { error?: { message?: string }; message?: string };
    };
    return data(
      {
        ok: false as const,
        error:
          err?.data?.error?.message ?? err?.data?.message ?? 'Request failed',
      },
      { status: typeof err?.status === 'number' ? err.status : 400 },
    );
  }

  return { ok: true as const, intent: body.intent };
}

const showToast = (item: ToastItem) =>
  config.getUtility({ name: 'show', type: 'toast' }).method(item);

export default function ManageTranslations() {
  const { title, contentPath, rows } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    if (fetcher.state === 'idle' && fetcher.data) {
      if (fetcher.data.ok) {
        showToast({
          title:
            fetcher.data.intent === 'link'
              ? t('cmsui.manage_translations.linked')
              : t('cmsui.manage_translations.unlinked'),
          icon: <LanguageIcon />,
        });
      } else {
        showToast({
          title: t('cmsui.manage_translations.failed'),
          description: fetcher.data.error,
          icon: <LanguageIcon />,
          className: 'error',
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetcher.state, fetcher.data]);

  const busy = fetcher.state !== 'idle';

  const link = (target: string) =>
    fetcher.submit(
      { intent: 'link', target },
      { method: 'POST', encType: 'application/json' },
    );

  const unlink = (language: string) =>
    fetcher.submit(
      { intent: 'unlink', language },
      { method: 'POST', encType: 'application/json' },
    );

  return (
    <>
      <Plug pluggable="toolbar-top" id="button-back">
        <Button
          aria-label={t('cmsui.manage_translations.back')}
          size="L"
          onPress={() => navigate(contentPath || '/')}
        >
          <Back />
        </Button>
      </Plug>
      <main>
        <Container width="default" className="route-manage-translations py-8">
          <h1 className="documentFirstHeading mb-6 text-2xl font-bold">
            {t('cmsui.manage_translations.title', { title })}
          </h1>
          <Table
            aria-label={t('cmsui.manage_translations.title', { title })}
            className="max-h-none rounded-none border-0 border-b border-b-neutral-200"
          >
            <TableHeader
              className={`
                border-b-quanta-silver bg-transparent backdrop-blur-none
                supports-[-moz-appearance:none]:bg-transparent
              `}
            >
              <Column
                isRowHeader
                width="1fr"
                minWidth={160}
                className="border-b border-b-neutral-200 font-medium text-quanta-sapphire"
              >
                {t('cmsui.manage_translations.language')}
              </Column>
              <Column
                width="2fr"
                minWidth={240}
                className="border-b border-b-neutral-200 font-medium text-quanta-sapphire"
              >
                {t('cmsui.manage_translations.path')}
              </Column>
              <Column
                width={112}
                className="border-b border-b-neutral-200 font-medium text-quanta-sapphire"
              >
                {t('cmsui.manage_translations.tools')}
              </Column>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const languageName =
                  langmap[row.language]?.nativeName ?? row.language;
                return (
                  <Row key={row.language}>
                    <Cell>
                      <div
                        className={`
                          flex min-h-10 items-center text-sm text-quanta-space
                          ${row.isCurrent ? 'font-bold' : ''}
                        `}
                      >
                        {languageName}
                      </div>
                    </Cell>
                    <Cell>
                      <div className="flex min-h-10 items-center text-sm">
                        {row.translationPath ? (
                          <Link
                            to={row.translationPath}
                            className={`
                              text-quanta-sapphire
                              hover:underline
                            `}
                          >
                            {row.translationPath}
                          </Link>
                        ) : (
                          <span className="text-quanta-pigeon">
                            {t('cmsui.manage_translations.no_translation')}
                          </span>
                        )}
                      </div>
                    </Cell>
                    <Cell>
                      <div className="flex min-h-10 items-center gap-1">
                        {!row.isCurrent &&
                          (row.translationPath ? (
                            <Button
                              variant="icon"
                              type="button"
                              aria-label={t(
                                'cmsui.manage_translations.unlink',
                                { language: languageName },
                              )}
                              onPress={() => unlink(row.language)}
                              isDisabled={busy}
                            >
                              <LinkIcon size="sm" />
                            </Button>
                          ) : (
                            <>
                              <LinkTranslationPicker
                                label={t('cmsui.manage_translations.link', {
                                  language: languageName,
                                })}
                                rootPath={row.rootPath}
                                isDisabled={busy}
                                onPick={(item) =>
                                  item['@id'] &&
                                  link(flattenToAppURL(item['@id']))
                                }
                              />
                              <Link
                                to={`/@@translate${contentPath}?language=${row.language}`}
                                aria-label={t(
                                  'cmsui.manage_translations.create',
                                  { language: languageName },
                                )}
                                className={`
                                  flex size-8 items-center justify-center rounded-full
                                  text-quanta-iron
                                  hover:bg-quanta-snow
                                  active:bg-quanta-silver
                                `}
                              >
                                <LanguageIcon size="sm" />
                              </Link>
                            </>
                          ))}
                      </div>
                    </Cell>
                  </Row>
                );
              })}
            </TableBody>
          </Table>
        </Container>
      </main>
    </>
  );
}

function LinkTranslationPicker({
  label,
  rootPath,
  isDisabled,
  onPick,
}: {
  label: string;
  rootPath: string;
  isDisabled?: boolean;
  onPick: (item: Partial<Brain>) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        variant="icon"
        type="button"
        aria-label={label}
        onPress={() => setOpen(true)}
        isDisabled={isDisabled}
      >
        <AddIcon size="sm" />
      </Button>
      {open && (
        <ObjectBrowserProvider
          config={{
            mode: 'single',
            title: label,
            initialPath: rootPath,
            onChange: (selected) => {
              if (selected.length > 0) {
                setOpen(false);
                onPick(selected[0]);
              }
            },
          }}
        >
          <ObjectBrowserModal isOpen={open} onOpenChange={setOpen} />
        </ObjectBrowserProvider>
      )}
    </>
  );
}

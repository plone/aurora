import { useState } from 'react';
import { useFetcher } from 'react-router';
import { useDateFormatter, VisuallyHidden } from 'react-aria';
import { Heading } from 'react-aria-components';
import { useTranslation } from 'react-i18next';
import type { Content, GetHistoryResponse } from '@plone/types';
import {
  Container,
  Breadcrumbs,
  Breadcrumb,
  Table,
  TableHeader,
  TableBody,
  Column,
  Row,
  Cell,
  Menu,
  MenuItem,
  MenuTrigger,
  Button,
  Dialog,
  Modal,
} from '@plone/components/quanta';
import {
  MoreoptionsIcon,
  EyeIcon,
  HistoryIcon,
  ReviewIcon,
  HomeIcon,
} from '@plone/components/Icons';
import CloseSVG from '@plone/components/icons/close.svg?react';
import UndoSVG from '@plone/components/icons/undo.svg?react';

type HistoryEntry = GetHistoryResponse[number];

// The colored status dot, using Quanta theme tokens (mirrors the approach of
// @plone/contents' ReviewState). Versioning (edits) are green; workflow entries
// are colored by their resulting review state (published = blue, private = red).
// TODO: replace with a global, configurable review-state -> color mapping
// shared with @plone/contents' ReviewState (see #30).
export function statusDotClass(entry: HistoryEntry): string {
  if ('version' in entry) return 'bg-quanta-neon';
  const state = 'review_state' in entry ? entry.review_state : undefined;
  if (state === 'published') return 'bg-quanta-cobalt';
  if (state === 'private') return 'bg-quanta-rose';
  return 'bg-quanta-pigeon';
}

// Human-friendly relative time ("2 minutes ago") in the active locale, using
// the built-in Intl API so we don't pull in a date library.
// TODO: extract into a shared helper in @plone/helpers (see #30).
export function formatRelativeTime(iso: string, locale: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return iso;
  const diffSeconds = Math.round((then - Date.now()) / 1000);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
    ['second', 1],
  ];
  for (const [unit, secondsInUnit] of units) {
    if (Math.abs(diffSeconds) >= secondsInUnit || unit === 'second') {
      return rtf.format(Math.round(diffSeconds / secondsInUnit), unit);
    }
  }
  return iso;
}

interface HistoryViewProps {
  content: Content;
  history: GetHistoryResponse;
}

export default function HistoryView({ content, history }: HistoryViewProps) {
  const { t, i18n } = useTranslation();
  const fetcher = useFetcher();
  const fullDateFormatter = useDateFormatter({
    dateStyle: 'full',
    timeStyle: 'short',
  });

  // The version selected for revert (mirrors @plone/contents' DeleteModal:
  // controlled state, submit on confirm). The open flag is separate from the
  // target data: the modal content must stay stable while the close animation
  // is still playing, so the target is never cleared on close.
  const [revertTarget, setRevertTarget] = useState<{
    version: number;
    time: string;
  } | null>(null);
  const [isRevertOpen, setIsRevertOpen] = useState(false);

  const submitRevert = () => {
    if (!revertTarget) return;
    fetcher.submit(
      { version: String(revertTarget.version) },
      { method: 'post' },
    );
    setIsRevertOpen(false);
  };

  // Entries arrive newest-first, so the first versioning entry is the current
  // revision. The current revision cannot be reverted to itself.
  const currentVersion = history.find((entry) => 'version' in entry)?.version;

  // Breadcrumbs from the content's @components.breadcrumbs, mirroring the
  // inline Quanta breadcrumb of @plone/contents (ContentsTable) for a
  // consistent look. The root item carries the HomeIcon.
  // TODO: this duplicates @plone/contents' inline breadcrumb; extract it into a
  // shared component so both routes stay visually in sync (see #30).
  const breadcrumbs = [
    {
      '@id': content['@components']?.breadcrumbs?.root || '/',
      title: t('cmsui.history.home'),
      icon: <HomeIcon size="sm" />,
    },
    ...(content['@components']?.breadcrumbs?.items ?? []).map((item) => ({
      '@id': item['@id'],
      title: item.title,
    })),
  ];

  return (
    <Container width="layout" className="changes min-h-dvh">
      <article
        id="content"
        className={`
          mx-auto px-4 py-4
          lg:px-8
        `}
      >
        <div className="title-block mb-4">
          <Breadcrumbs
            items={breadcrumbs}
            className="history-breadcrumbs text-quanta-sapphire"
          >
            {(item) => (
              <Breadcrumb
                id={item['@id']}
                href={item['@id']}
                className={`
                  text-quanta-sapphire decoration-quanta-sapphire/50
                  hover:decoration-quanta-sapphire
                `}
              >
                {item.title}
              </Breadcrumb>
            )}
          </Breadcrumbs>
          <h1 className="text-2xl font-bold">
            {t('cmsui.history.changesTo', { title: content.title })}
          </h1>
        </div>

        <Table
          aria-label={t('cmsui.history.label')}
          className="max-h-none border-0"
        >
          <TableHeader>
            <Column isRowHeader width="30%">
              {t('cmsui.history.column.action')}
            </Column>
            <Column width="20%">{t('cmsui.history.column.by')}</Column>
            <Column width="15%">{t('cmsui.history.column.time')}</Column>
            <Column width="25%">{t('cmsui.history.column.changeNote')}</Column>
            <Column width={56}>
              <VisuallyHidden>{t('cmsui.history.actions')}</VisuallyHidden>
            </Column>
          </TableHeader>
          <TableBody>
            {history.map((entry, index) => {
              const versioned = 'version' in entry;
              const isCurrent = versioned && entry.version === currentVersion;
              return (
                <Row key={index} id={String(index)}>
                  <Cell>
                    <span className="flex items-center gap-2">
                      <span
                        aria-hidden
                        className={`
                          inline-block h-2 w-2 shrink-0 rounded-full
                          ${statusDotClass(entry)}
                        `}
                      />
                      {entry.transition_title}
                    </span>
                  </Cell>
                  <Cell>{entry.actor?.fullname}</Cell>
                  <Cell>
                    <time
                      dateTime={entry.time}
                      title={fullDateFormatter.format(new Date(entry.time))}
                      suppressHydrationWarning
                    >
                      {formatRelativeTime(entry.time, i18n.language)}
                    </time>
                  </Cell>
                  <Cell>{entry.comments}</Cell>
                  <Cell>
                    {versioned ? (
                      <MenuTrigger>
                        <Button
                          variant="neutral"
                          aria-label={t('cmsui.history.actions')}
                        >
                          <MoreoptionsIcon />
                        </Button>
                        <Menu>
                          <MenuItem isDisabled>
                            <ReviewIcon />
                            {t('cmsui.history.reviewChanges')}
                          </MenuItem>
                          <MenuItem
                            href={`${content['@id']}?version=${entry.version}`}
                          >
                            <EyeIcon />
                            {t('cmsui.history.viewRevision')}
                          </MenuItem>
                          {entry.may_revert && !isCurrent ? (
                            <MenuItem
                              className={`
                                text-quanta-candy
                                data-[focused]:bg-quanta-candy data-[focused]:text-white
                              `}
                              onAction={() => {
                                setRevertTarget({
                                  version: entry.version,
                                  time: entry.time,
                                });
                                setIsRevertOpen(true);
                              }}
                            >
                              <HistoryIcon />
                              {t('cmsui.history.revert')}
                            </MenuItem>
                          ) : null}
                        </Menu>
                      </MenuTrigger>
                    ) : null}
                  </Cell>
                </Row>
              );
            })}
          </TableBody>
        </Table>

        <Modal
          isDismissable
          isOpen={isRevertOpen}
          onOpenChange={setIsRevertOpen}
        >
          <Dialog className="p-8">
            <Heading
              slot="title"
              className="react-aria-Heading mb-1 text-center text-xl font-bold"
            >
              {t('cmsui.history.modalRevert.title')}
            </Heading>
            <p className="text-center text-sm">
              {t('cmsui.history.modalRevert.description', {
                title: content.title,
                time: revertTarget
                  ? fullDateFormatter.format(new Date(revertTarget.time))
                  : '',
              })}
            </p>
            <div className="mt-8 flex justify-center gap-3">
              <Button
                className="react-aria-Button close"
                onPress={() => setIsRevertOpen(false)}
                aria-label={t('cmsui.history.modalRevert.cancel')}
                accent={true}
                size="L"
              >
                <CloseSVG />
              </Button>
              <Button
                className="react-aria-Button revert"
                onPress={submitRevert}
                aria-label={t('cmsui.history.modalRevert.confirm')}
                variant="destructive"
                accent={true}
                size="L"
              >
                <UndoSVG />
              </Button>
            </div>
          </Dialog>
        </Modal>
      </article>
    </Container>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { useFetcher, useRevalidator, type SubmitTarget } from 'react-router';
import { Heading } from 'react-aria-components';
import { useTranslation } from 'react-i18next';
import { Button, Dialog, Modal } from '@plone/components/quanta';
import { CloseIcon, TagIcon, ChevrondownIcon } from '@plone/components/Icons';
import { type ToastItem } from '@plone/layout/config/toast';
import { useContentsContext } from '../../providers/contents';
import { buildTagsPayload, unionSubjects } from '../../helpers/tags';

export default function TagsModal() {
  const { t } = useTranslation();
  const fetcher = useFetcher();
  const vocabularyFetcher = useFetcher<{ vocabulary: string[] }>();
  const { revalidate } = useRevalidator();
  const { showTags, setShowTags, selected, setSelected, showToast } =
    useContentsContext();

  const items = useMemo(() => [...selected], [selected]);
  const existingTags = useMemo(() => unionSubjects(items), [items]);

  const [added, setAdded] = useState<string[]>([]);
  const [removed, setRemoved] = useState<string[]>([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    if (showTags) {
      setAdded([]);
      setRemoved([]);
      setInput('');
      vocabularyFetcher.load('/@@contents/@@tags');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showTags]);

  useEffect(() => {
    if (fetcher.state === 'idle' && fetcher.data) {
      const data = fetcher.data;
      if (data?.ok?.length > 0) {
        const toast: ToastItem = {
          title:
            data.ok.length === 1
              ? t('contents.actions.tagged', { title: data.ok[0].title })
              : t('contents.actions.tagged_multiple', {
                  number: data.ok.length,
                }),
          icon: <TagIcon />,
        };
        showToast(toast);
        revalidate();
      }
      if (data?.errors?.length > 0) {
        data.errors.forEach((e: any) => {
          showToast({
            title: `${t('contents.error')} ${e.__error?.status} - ${e.__error?.data?.type}`,
            description: e.__error?.data?.message,
            icon: <TagIcon />,
            className: 'error',
          });
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetcher.state]);

  if (!showTags) return null;

  const vocabulary = vocabularyFetcher.data?.vocabulary ?? [];
  const visibleExisting = existingTags.filter((tag) => !removed.includes(tag));

  const close = () => {
    setSelected('none');
    setShowTags(false);
  };

  const addTag = (tag: string) => {
    const value = tag.trim();
    if (!value) return;
    if (removed.includes(value)) {
      setRemoved(removed.filter((t) => t !== value));
    } else if (!existingTags.includes(value) && !added.includes(value)) {
      setAdded([...added, value]);
    }
    setInput('');
  };

  const removeExisting = (tag: string) => setRemoved([...removed, tag]);
  const removeAdded = (tag: string) => setAdded(added.filter((t) => t !== tag));

  const confirm = () => {
    const itemsToTag = buildTagsPayload(items, added, removed);
    if (itemsToTag.length === 0) {
      close();
      return;
    }
    fetcher.submit({ items: itemsToTag } as unknown as SubmitTarget, {
      method: 'PATCH',
      encType: 'application/json',
      action: '/@@contents/@@tags',
    });
    close();
  };

  return (
    <Modal isDismissable isOpen={showTags} onOpenChange={setShowTags}>
      <Dialog className="mx-auto w-full p-8">
        <Heading
          slot="title"
          className="react-aria-Heading mb-6 text-xl font-bold"
        >
          {t('contents.modal_tags.title')}
        </Heading>
        <div className="mx-auto max-w-xl">
          <span className="mb-2 block text-sm font-bold">
            {t('contents.modal_tags.current_label')}
          </span>
          <div className="mb-5 flex min-h-8 flex-wrap items-center gap-2">
            {visibleExisting.map((tag) => (
              <TagChip
                key={`e-${tag}`}
                label={tag}
                onRemove={() => removeExisting(tag)}
              />
            ))}
            {added.map((tag) => (
              <TagChip
                key={`a-${tag}`}
                label={tag}
                added
                onRemove={() => removeAdded(tag)}
              />
            ))}
            {visibleExisting.length === 0 && added.length === 0 && (
              <span className="text-quanta-graphite px-1 text-sm">
                {t('contents.modal_tags.empty')}
              </span>
            )}
          </div>

          <label className="mb-1 block text-sm font-bold" htmlFor="tags-add">
            {t('contents.modal_tags.add_label')}
          </label>
          <div
            className={`
              flex items-center gap-2 rounded-lg border border-quanta-silver bg-quanta-air pe-3
              transition-colors
              focus-within:border-quanta-sapphire
            `}
          >
            <input
              id="tags-add"
              type="text"
              list="tags-vocabulary"
              value={input}
              placeholder={t('contents.modal_tags.add_placeholder')}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addTag(input);
                }
              }}
              aria-label={t('contents.modal_tags.add_label')}
              className={`
                min-w-0 flex-1 appearance-none bg-transparent py-2 ps-3 text-sm outline-0
                placeholder:text-quanta-pigeon
                [&::-webkit-calendar-picker-indicator]:hidden!
                [&::-webkit-calendar-picker-indicator]:appearance-none
              `}
            />
            <ChevrondownIcon
              aria-hidden
              size="base"
              className="pointer-events-none shrink-0 text-quanta-pigeon"
            />
          </div>
          <p className="text-quanta-graphite mt-1 text-xs">
            {t('contents.modal_tags.add_hint')}
          </p>
          <datalist id="tags-vocabulary">
            {vocabulary.map((tag) => (
              <option key={tag} value={tag} />
            ))}
          </datalist>

          <div className="mt-8 flex justify-center gap-3">
            <Button
              onPress={close}
              aria-label={t('contents.modal.close')}
              accent={true}
              size="L"
            >
              <CloseIcon />
            </Button>
            <Button
              onPress={confirm}
              aria-label={t('contents.modal_tags.confirm')}
              variant="primary"
              accent={true}
              size="L"
              isDisabled={fetcher.state !== 'idle'}
            >
              <TagIcon />
            </Button>
          </div>
        </div>
      </Dialog>
    </Modal>
  );
}

function TagChip({
  label,
  added,
  onRemove,
}: {
  label: string;
  added?: boolean;
  onRemove: () => void;
}) {
  const { t } = useTranslation();
  return (
    <span
      className={`
        inline-flex items-center gap-1 rounded-full py-1 ps-3 pe-1 text-sm font-medium
        text-quanta-space
        ${added ? 'bg-quanta-tiffany' : 'bg-quanta-azure'}
      `}
    >
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={t('contents.modal_tags.remove', { tag: label })}
        className={`
          flex h-5 w-5 items-center justify-center rounded-full transition-colors
          hover:bg-black/10
          focus-visible:outline-2 focus-visible:outline-quanta-sapphire
        `}
      >
        <CloseIcon aria-hidden className="h-3 w-3" />
      </button>
    </span>
  );
}

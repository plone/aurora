import { useEffect, useMemo, useState } from 'react';
import { useFetcher, useRevalidator } from 'react-router';
import { Button as RACButton, Heading } from 'react-aria-components';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Checkbox,
  Dialog,
  Input,
  Modal,
  Select,
} from '@plone/components/quanta';
import { ArrowrightIcon, CloseIcon, StateIcon } from '@plone/components/Icons';
import { type ToastItem } from '@plone/layout/config/toast';
import { useContentsContext } from '../../providers/contents';
import type { TransitionOption } from '../../helpers/workflow';

interface WorkflowData {
  transitions: TransitionOption[];
  states: Array<{ id: string; title: string }>;
}

export default function WorkflowModal() {
  const { t } = useTranslation();
  const fetcher = useFetcher();
  const dataFetcher = useFetcher<WorkflowData>();
  const { revalidate } = useRevalidator();
  const { showWorkflow, setShowWorkflow, selected, setSelected, showToast } =
    useContentsContext();

  const items = useMemo(() => [...selected], [selected]);
  const [transition, setTransition] = useState('');
  const [comment, setComment] = useState('');
  const [includeChildren, setIncludeChildren] = useState(false);

  useEffect(() => {
    if (showWorkflow) {
      setTransition('');
      setComment('');
      setIncludeChildren(false);
      const params = new URLSearchParams();
      items.forEach((item) => params.append('path', item['@id']));
      dataFetcher.load(`/@@contents/@@workflow?${params.toString()}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showWorkflow]);

  useEffect(() => {
    if (fetcher.state === 'idle' && fetcher.data) {
      const data = fetcher.data;
      if (data?.ok?.length > 0) {
        const toast: ToastItem = {
          title:
            data.ok.length === 1
              ? t('contents.actions.state_changed', { title: data.ok[0].title })
              : t('contents.actions.state_changed_multiple', {
                  number: data.ok.length,
                }),
          icon: <StateIcon />,
        };
        showToast(toast);
        revalidate();
      }
      if (data?.errors?.length > 0) {
        data.errors.forEach((e: any) => {
          showToast({
            title: `${t('contents.error')} ${e.__error?.status} - ${e.__error?.data?.type}`,
            description: e.__error?.data?.message,
            icon: <StateIcon />,
            className: 'error',
          });
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetcher.state]);

  if (!showWorkflow) return null;

  const transitions = dataFetcher.data?.transitions ?? [];
  const states = dataFetcher.data?.states ?? [];
  const stateSummary = summarizeStates(states);
  const loadingTransitions = dataFetcher.state !== 'idle';

  const close = () => {
    setSelected('none');
    setShowWorkflow(false);
  };

  const confirm = () => {
    if (!transition) return;
    fetcher.submit(
      {
        items: items.map((i) => ({ '@id': i['@id'], title: i.title })),
        transition,
        comment,
        include_children: includeChildren,
      },
      {
        method: 'POST',
        encType: 'application/json',
        action: '/@@contents/@@workflow',
      },
    );
    close();
  };

  return (
    <Modal isDismissable isOpen={showWorkflow} onOpenChange={setShowWorkflow}>
      <Dialog className="mx-auto w-full p-8">
        <div className="mb-10 flex items-center justify-between">
          <Heading
            slot="title"
            className="react-aria-Heading text-xl font-bold"
          >
            {t('contents.modal_workflow.title')}
          </Heading>
          <RACButton
            onPress={close}
            aria-label={t('contents.modal.close')}
            className={`
              cursor-pointer text-quanta-space
              hover:text-quanta-sapphire
              [&_svg]:size-5
            `}
          >
            <CloseIcon />
          </RACButton>
        </div>
        <div className="mx-auto grid max-w-sm gap-4">
          {stateSummary && (
            <p className="text-quanta-graphite text-sm">
              {t('contents.modal_workflow.current_state')}: {stateSummary}
            </p>
          )}

          <div className="grid gap-1 text-sm">
            <Select
              aria-label={t('contents.modal_workflow.transition')}
              items={transitions.map((tr) => ({
                label: tr.title,
                value: tr.id,
              }))}
              selectedKey={transition || null}
              onSelectionChange={(key) => setTransition(String(key))}
              placeholder={t('contents.modal_workflow.select_transition')}
              isDisabled={loadingTransitions}
            />
            {!loadingTransitions && transitions.length === 0 && (
              <span className="text-quanta-candy">
                {t('contents.modal_workflow.no_common_transitions')}
              </span>
            )}
          </div>

          <label className="block text-sm">
            <span className="text-quanta-graphite mb-1 block text-xs">
              {t('contents.modal_workflow.comment')}
            </span>
            <Input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              aria-label={t('contents.modal_workflow.comment')}
              className="h-11 w-full rounded-lg px-3"
            />
          </label>

          <Checkbox
            className="text-sm text-quanta-space"
            isSelected={includeChildren}
            onChange={setIncludeChildren}
          >
            <span className="relative top-px leading-5">
              {t('contents.modal_workflow.include_children')}
            </span>
          </Checkbox>

          <div className="mt-6 flex justify-end">
            <Button
              onPress={confirm}
              aria-label={t('contents.modal_workflow.confirm')}
              variant="primary"
              accent={true}
              size="L"
              isDisabled={!transition || fetcher.state !== 'idle'}
            >
              <ArrowrightIcon />
            </Button>
          </div>
        </div>
      </Dialog>
    </Modal>
  );
}

function summarizeStates(states: Array<{ id: string; title: string }>): string {
  if (states.length === 0) return '';
  const counts = new Map<string, number>();
  states.forEach((s) => counts.set(s.title, (counts.get(s.title) ?? 0) + 1));
  return [...counts.entries()]
    .map(([title, count]) => (count > 1 ? `${title} (${count})` : title))
    .join(', ');
}

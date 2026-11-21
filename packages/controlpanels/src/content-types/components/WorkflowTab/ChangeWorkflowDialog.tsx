import { useEffect, useState } from 'react';
import { Radio, RadioGroup } from 'react-aria-components';
import {
  Button,
  Dialog,
  Heading,
  Modal,
  ProgressBar,
  Select,
} from '@plone/quanta';
import {
  useNotify,
  useTranslate,
} from '../../../provider/ControlPanelsProvider';
import { useContentTypesDriver } from '../../driver';
import { messages } from '../../messages';
import type {
  ContentTypeSummary,
  WorkflowChangePreview,
  WorkflowChangeRequest,
  WorkflowInfo,
} from '../../types';
import {
  FOLLOW_DEFAULT,
  NO_WORKFLOW,
  changedItems,
  chosenWorkflow,
  completeStateMap,
  mappingRows,
  mostVisible,
  type MappingRow,
} from '../../workflow/workflowChange';
import { StateBadge, VISIBILITY_LABELS } from './StateBadge';

export interface ChangeWorkflowDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  /**
   * The types to change, with their workflow and item count. With
   * `siteDefault`, every type: the ones that follow the default change.
   */
  types: ContentTypeSummary[];
  /** Change the site default, and with it the types that follow it. */
  siteDefault?: boolean;
  workflows: WorkflowInfo[];
  /** The site default workflow, `null` when there is none. */
  defaultWorkflow: string | null;
  /** Called after the workflow changed. */
  onChanged: () => void;
}

type Step = 1 | 2 | 3 | 'run';

// How long to wait between asking how a change is going.
const POLL_INTERVAL = 250;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Changes the workflow of some types, or the site default, in three steps:
 * choose the new workflow, choose the new state of the items in each current
 * state (one table per current workflow), and review what changes before
 * anything does. Suggestions keep who can see each item.
 */
export function ChangeWorkflowDialog({
  isOpen,
  onOpenChange,
  types,
  siteDefault = false,
  workflows,
  defaultWorkflow,
  onChanged,
}: ChangeWorkflowDialogProps) {
  const t = useTranslate();
  const notify = useNotify();
  const driver = useContentTypesDriver();
  const [step, setStep] = useState<Step>(1);
  const [choice, setChoice] = useState<string>();
  const [preview, setPreview] = useState<WorkflowChangePreview>();
  const [previewError, setPreviewError] = useState<string>();
  const [stateMap, setStateMap] = useState<
    Record<string, Record<string, string>>
  >({});
  const [progress, setProgress] = useState(0);
  const [runError, setRunError] = useState<string>();
  // The types and the default when the dialog opened: the page loads them
  // again after the change, while the dialog is still closing.
  const [from, setFrom] = useState({ types, defaultWorkflow });

  useEffect(() => {
    if (!isOpen) return;
    setStep(1);
    setChoice(undefined);
    setPreview(undefined);
    setPreviewError(undefined);
    setStateMap({});
    setProgress(0);
    setRunError(undefined);
    setFrom({ types, defaultWorkflow });
    // Only when the dialog opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const titleOf = (id: string | null) =>
    id === null
      ? t(messages.noWorkflow)
      : (workflows.find((entry) => entry.id === id)?.title ?? id);
  const itemsLabel = (n: number) =>
    n === 1 ? t(messages.oneItem) : t(messages.items, { count: n });
  const assignmentOf = (type: ContentTypeSummary) =>
    type.workflow ?? { workflow: null, followsDefault: false };

  const affected = siteDefault
    ? from.types.filter((type) => type.workflow?.followsDefault)
    : from.types;
  const [single] = affected.length === 1 ? affected : [];
  const typeTitles = affected.map((type) => type.title).join(', ');
  const count = affected.reduce((sum, type) => sum + type.count, 0);
  // What changes, in the title and the sentences: a type, some types, or the
  // site default.
  const subject = siteDefault
    ? t(messages.siteDefaultWorkflow)
    : (single?.title ?? t(messages.typesCount, { count: affected.length }));
  // The first type's, when several share no workflow: it only picks which
  // workflows to offer.
  const current = siteDefault
    ? from.defaultWorkflow
    : affected[0]
      ? assignmentOf(affected[0]).workflow
      : null;
  const currentInfo = workflows.find((entry) => entry.id === current);

  // Workflows meant for comments are only offered for comments, and the
  // other way around.
  const scope =
    currentInfo?.scope ??
    (!siteDefault && affected.every((type) => type.kind === 'other')
      ? 'comments'
      : 'content');
  const offered = workflows.filter((entry) => entry.scope === scope);
  const hidden = workflows.length - offered.length;
  const currentChoice = siteDefault
    ? (from.defaultWorkflow ?? NO_WORKFLOW)
    : single
      ? assignmentOf(single).followsDefault
        ? FOLLOW_DEFAULT
        : (assignmentOf(single).workflow ?? NO_WORKFLOW)
      : undefined;
  const options = [
    ...(!siteDefault && defaultWorkflow !== null ? [FOLLOW_DEFAULT] : []),
    ...offered.map((entry) => entry.id),
    NO_WORKFLOW,
  ];
  const target = choice ? chosenWorkflow(choice, defaultWorkflow) : undefined;
  const request = (): WorkflowChangeRequest =>
    siteDefault
      ? { siteDefault: true, workflow: target ?? null }
      : {
          types: affected.map((type) => type.id),
          workflow: target ?? null,
          followDefault: choice === FOLLOW_DEFAULT || undefined,
        };

  const toMapping = async () => {
    setStep(2);
    setPreview(undefined);
    setPreviewError(undefined);
    setStateMap({});
    try {
      setPreview(await driver.previewWorkflowChange!(request()));
    } catch (reason) {
      setPreviewError(reason instanceof Error ? reason.message : undefined);
    }
  };

  const run = async () => {
    if (!preview) return;
    setStep('run');
    setRunError(undefined);
    try {
      let job = await driver.changeWorkflow!({
        ...request(),
        stateMap: completeStateMap(preview, stateMap),
      });
      while (job.status === 'running') {
        setProgress(job.progress);
        await wait(POLL_INTERVAL);
        job = await driver.getWorkflowChangeJob!(job.id);
      }
      if (job.status === 'failed') throw new Error(job.error);
      notify({
        title: siteDefault
          ? t(messages.siteDefaultChanged, {
              workflow: titleOf(target ?? null),
            })
          : t(
              single ? messages.workflowChanged : messages.workflowChangedMany,
              {
                title: subject,
                workflow: titleOf(target ?? null),
              },
            ),
        description: t(messages.workflowChangedItems, {
          items: itemsLabel(job.changed),
        }),
        variant: 'success',
      });
      onOpenChange(false);
      onChanged();
    } catch (reason) {
      setStep(3);
      setRunError(reason instanceof Error ? reason.message : '');
    }
  };

  const visibility = (row: MappingRow) =>
    t(VISIBILITY_LABELS[row.state?.visibility ?? 'unknown']);
  const tables = (preview?.groups ?? []).map((group) => ({
    key: group.workflow ?? '',
    group,
    rows: mappingRows(
      group,
      preview!.workflow,
      workflows,
      stateMap[group.workflow ?? ''] ?? {},
    ),
  }));
  const rows = tables.flatMap(({ key, rows }) =>
    rows.map((row) => ({ group: key, row })),
  );
  const targetInfo = workflows.find((entry) => entry.id === target);
  const lessVisible = rows.some(({ row }) => row.count > 0 && row.change < 0);
  const moved = preview ? changedItems(preview) : 0;

  const steps: Array<[Exclude<Step, 'run'>, string]> = [
    [1, t(messages.stepChoose)],
    [2, t(messages.stepMap)],
    [3, t(messages.stepReview)],
  ];

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      isDismissable={step !== 'run'}
    >
      <Dialog className="mx-auto flex max-h-[90vh] w-full flex-col gap-4 p-8">
        <div className="flex flex-col gap-1">
          <Heading slot="title" className="text-xl font-semibold">
            {siteDefault
              ? t(messages.changeDefaultWorkflowTitle)
              : t(messages.changeWorkflowTitle, { title: subject })}
          </Heading>
          <p className="text-sm text-quanta-pigeon">
            {siteDefault
              ? t(messages.changeDefaultWorkflowSubtitle, {
                  workflow: titleOf(current ?? null),
                  types: typeTitles || t(messages.noTypes),
                })
              : single
                ? t(messages.changeWorkflowSubtitle, {
                    items: itemsLabel(count),
                    workflow: assignmentOf(single).followsDefault
                      ? `${titleOf(current ?? null)} (${t(messages.siteDefault)})`
                      : titleOf(current ?? null),
                  })
                : `${itemsLabel(count)} · ${typeTitles}`}
          </p>
        </div>

        <ol
          aria-label={t(messages.steps)}
          className={`
            flex flex-wrap gap-x-5 gap-y-2 border-b border-quanta-smoke pb-3 text-sm
            text-quanta-pigeon
          `}
        >
          {steps.map(([id, label]) => {
            const isCurrent = step === id || (step === 'run' && id === 3);
            const isDone =
              step === 'run' || (typeof step === 'number' && id < step);
            return (
              <li
                key={id}
                aria-current={isCurrent ? 'step' : undefined}
                className={`
                  inline-flex items-center gap-2
                  ${isCurrent ? 'font-semibold text-quanta-space' : ''}
                `}
              >
                <span
                  aria-hidden
                  className={`
                    grid size-5 place-items-center rounded-full border font-mono text-xs
                    ${
                      isCurrent
                        ? 'border-quanta-sapphire bg-quanta-sapphire text-quanta-air'
                        : isDone
                          ? 'border-transparent bg-quanta-arctic text-quanta-sapphire'
                          : 'border-quanta-silver'
                    }
                  `}
                >
                  {id}
                </span>
                {label}
              </li>
            );
          })}
        </ol>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto pr-1">
          {step === 1 && (
            <>
              <RadioGroup
                aria-label={t(messages.workflow)}
                value={choice ?? null}
                onChange={setChoice}
                className="flex flex-col gap-2"
              >
                {options.map((option) => {
                  const id = chosenWorkflow(option, defaultWorkflow);
                  const info = workflows.find((entry) => entry.id === id);
                  const isCurrent = option === currentChoice;
                  const top = info && mostVisible(info.states);
                  return (
                    <Radio
                      key={option}
                      value={option}
                      isDisabled={isCurrent}
                      className={({
                        isSelected,
                        isFocusVisible,
                        isDisabled,
                      }) => `
                        grid cursor-pointer grid-cols-[1rem_minmax(0,1fr)] gap-x-3 gap-y-1
                        rounded-lg border p-3 text-sm outline-none
                        ${isSelected ? 'border-quanta-sapphire bg-quanta-arctic' : 'border-quanta-smoke hover:bg-quanta-snow'}
                        ${isFocusVisible ? 'ring-2 ring-quanta-sapphire ring-offset-2' : ''}
                        ${isDisabled ? 'cursor-default opacity-75' : ''}
                      `}
                    >
                      {({ isSelected }) => (
                        <>
                          <span
                            aria-hidden
                            className={`
                              mt-0.5 size-4 rounded-full border-quanta-sapphire
                              ${isSelected ? 'border-5' : 'border-[1.5px] border-quanta-pigeon'}
                            `}
                          />
                          <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                            <span className="font-semibold">
                              {option === FOLLOW_DEFAULT
                                ? t(messages.followDefault)
                                : titleOf(id)}
                            </span>
                            <span className="font-mono text-xs text-quanta-pigeon">
                              {option === FOLLOW_DEFAULT
                                ? titleOf(id)
                                : (id ?? '')}
                            </span>
                            {isCurrent && (
                              <span className="rounded-full border border-quanta-smoke px-2 text-xs">
                                {t(messages.current)}
                              </span>
                            )}
                          </span>
                          <span className="col-start-2 text-quanta-pigeon">
                            {info
                              ? [
                                  info.description,
                                  top &&
                                    t(messages.mostVisible, {
                                      visibility: t(
                                        VISIBILITY_LABELS[top],
                                      ).toLowerCase(),
                                    }),
                                ]
                                  .filter(Boolean)
                                  .join(' ')
                              : t(messages.noWorkflowDescription)}
                          </span>
                          {info && (
                            <span className="col-start-2 flex flex-wrap gap-1">
                              {info.states.map((state) => (
                                <StateBadge key={state.id} state={state} />
                              ))}
                            </span>
                          )}
                        </>
                      )}
                    </Radio>
                  );
                })}
              </RadioGroup>
              {hidden > 0 && scope === 'content' && (
                <p className="text-sm text-quanta-pigeon">
                  {t(messages.otherScopeWorkflows, { count: hidden })}
                </p>
              )}
            </>
          )}

          {step === 2 && (
            <>
              {previewError !== undefined && (
                <div role="alert" className="text-sm text-quanta-candy">
                  {t(messages.previewError)} {previewError}
                </div>
              )}
              {!preview && previewError === undefined && (
                <p className="text-sm text-quanta-pigeon">
                  {t(messages.loadingPreview)}
                </p>
              )}
              {preview && (
                <>
                  <p className="text-sm text-quanta-pigeon">
                    {targetInfo
                      ? t(messages.mapHint, { workflow: targetInfo.title })
                      : t(messages.mapNothing, {
                          workflow: t(messages.noWorkflow),
                        })}
                  </p>
                  {tables.map(({ key: group, group: entry, rows }) => (
                    <section
                      key={group}
                      aria-label={
                        tables.length > 1
                          ? t(messages.mapGroup, {
                              workflow: titleOf(entry.workflow),
                            })
                          : undefined
                      }
                      className="flex flex-col gap-2"
                    >
                      {tables.length > 1 && (
                        <h3 className="text-sm font-semibold">
                          {t(messages.mapGroupTitle, {
                            workflow: titleOf(entry.workflow),
                            types: entry.types
                              .map(
                                (id) =>
                                  affected.find((type) => type.id === id)
                                    ?.title ?? id,
                              )
                              .join(', '),
                          })}
                        </h3>
                      )}
                      <ul
                        aria-label={t(messages.stepMap)}
                        className={`
                          flex flex-col divide-y divide-quanta-smoke rounded-lg border
                          border-quanta-smoke
                        `}
                      >
                        {rows.map((row) => {
                          const title =
                            row.state?.title ?? t(messages.withoutState);
                          return (
                            <li
                              key={`${group}/${row.id}`}
                              className={`
                                grid items-start gap-3 p-3 text-sm
                                sm:grid-cols-[minmax(0,1fr)_1.5rem_minmax(0,1.2fr)]
                                ${row.count ? '' : 'bg-quanta-snow text-quanta-pigeon'}
                              `}
                            >
                              <span className="flex flex-col gap-1">
                                <strong className="font-semibold">
                                  {title}
                                </strong>
                                <span className="text-xs">
                                  {visibility(row)}
                                </span>
                                <span className="text-xs text-quanta-pigeon">
                                  {row.count
                                    ? itemsLabel(row.count)
                                    : t(messages.noItemsInState)}
                                </span>
                              </span>
                              <span
                                aria-hidden
                                className={`
                                  hidden pt-2 text-center font-mono text-quanta-pigeon
                                  sm:block
                                `}
                              >
                                →
                              </span>
                              {targetInfo ? (
                                <span className="flex flex-col items-start gap-1">
                                  <Select
                                    aria-label={t(messages.newStateFor, {
                                      state: title,
                                    })}
                                    selectedKey={row.target?.id ?? null}
                                    onSelectionChange={(key) =>
                                      key &&
                                      setStateMap((map) => ({
                                        ...map,
                                        [group]: {
                                          ...map[group],
                                          [row.id]: String(key),
                                        },
                                      }))
                                    }
                                    items={targetInfo.states.map((state) => ({
                                      value: state.id,
                                      label: t(messages.stateOption, {
                                        state: state.title,
                                        visibility: t(
                                          VISIBILITY_LABELS[state.visibility],
                                        ).toLowerCase(),
                                      }),
                                    }))}
                                    className="w-full"
                                  />
                                  {row.count > 0 && row.target && (
                                    <span
                                      className={`
                                        rounded-full px-2 py-0.5 text-xs
                                        ${
                                          row.change < 0
                                            ? 'bg-quanta-cream text-quanta-bronze'
                                            : row.change > 0
                                              ? 'bg-quanta-ballet text-quanta-wine'
                                              : 'bg-quanta-daiquiri text-quanta-turtle'
                                        }
                                      `}
                                    >
                                      {row.change < 0
                                        ? t(messages.lessVisible, {
                                            visibility: t(
                                              VISIBILITY_LABELS[
                                                row.target.visibility
                                              ],
                                            ).toLowerCase(),
                                          })
                                        : row.change > 0
                                          ? t(messages.moreVisible, {
                                              visibility: t(
                                                VISIBILITY_LABELS[
                                                  row.target.visibility
                                                ],
                                              ).toLowerCase(),
                                            })
                                          : t(messages.sameVisibility)}
                                    </span>
                                  )}
                                  {row.target?.id === row.suggested && (
                                    <span
                                      className={`
                                        font-mono text-xs tracking-wide text-quanta-sapphire
                                        uppercase
                                      `}
                                    >
                                      {t(messages.suggested)}
                                    </span>
                                  )}
                                </span>
                              ) : (
                                row.count > 0 && (
                                  <span
                                    className={`
                                      self-center rounded-full bg-quanta-cream px-2 py-0.5 text-xs
                                      text-quanta-bronze
                                    `}
                                  >
                                    {t(messages.dependsOnFolder)}
                                  </span>
                                )
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </section>
                  ))}
                  {lessVisible && (
                    <div
                      role="status"
                      className={`
                        flex flex-col gap-1 rounded-lg border border-quanta-banana bg-quanta-cream
                        p-3 text-sm
                      `}
                    >
                      <strong>{t(messages.lessVisibleWarning)}</strong>
                      <span>{t(messages.lessVisibleWarningHelp)}</span>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {(step === 3 || step === 'run') && preview && (
            <div className="flex flex-col gap-3 text-sm">
              <p>
                {siteDefault
                  ? t(messages.reviewSiteDefault, {
                      workflow: titleOf(target ?? null),
                      current: titleOf(current ?? null),
                      types: typeTitles || t(messages.noTypes),
                    })
                  : choice === FOLLOW_DEFAULT
                    ? t(messages.reviewFollowDefault, {
                        title: subject,
                        workflow: titleOf(target ?? null),
                      })
                    : single
                      ? t(messages.reviewIntro, {
                          title: subject,
                          workflow: titleOf(target ?? null),
                          current: titleOf(current ?? null),
                        })
                      : t(messages.reviewIntroMany, {
                          workflow: titleOf(target ?? null),
                          types: typeTitles,
                        })}
              </p>
              <ul className="flex list-disc flex-col gap-2 pl-5">
                {rows
                  .filter(({ row }) => row.count > 0)
                  .map(({ group, row }) => (
                    <li key={`${group}/${row.id}`}>
                      {row.target
                        ? `${t(messages.reviewRow, {
                            items: itemsLabel(row.count),
                            from: row.state?.title ?? t(messages.withoutState),
                            to: row.target.title,
                          })} ${
                            row.change === 0
                              ? t(messages.reviewSame, {
                                  visibility: t(
                                    VISIBILITY_LABELS[row.target.visibility],
                                  ).toLowerCase(),
                                })
                              : t(
                                  row.change < 0
                                    ? messages.reviewLess
                                    : messages.reviewMore,
                                  {
                                    visibility: t(
                                      VISIBILITY_LABELS[row.target.visibility],
                                    ).toLowerCase(),
                                    was: visibility(row).toLowerCase(),
                                  },
                                )
                          }`
                        : `${itemsLabel(row.count)}: ${t(messages.reviewNoWorkflow)}`}
                    </li>
                  ))}
                {moved === 0 && <li>{t(messages.reviewNoItems)}</li>}
                {targetInfo && (
                  <li>
                    {t(messages.reviewInitial, {
                      state:
                        targetInfo.states.find(
                          (state) => state.id === targetInfo.initialState,
                        )?.title ?? targetInfo.initialState,
                    })}
                  </li>
                )}
                {preview.unaffected > 0 && (
                  <li>
                    {t(messages.reviewUnaffected, {
                      count: preview.unaffected,
                    })}
                  </li>
                )}
              </ul>
              <p className="rounded-lg bg-quanta-arctic p-3">
                {t(messages.reviewNote)}
              </p>
              {runError !== undefined && (
                <div role="alert" className="text-quanta-candy">
                  {t(messages.workflowChangeError, { title: subject })}{' '}
                  {runError}
                </div>
              )}
              {step === 'run' && (
                <ProgressBar
                  label={t(messages.changingWorkflow)}
                  value={progress * 100}
                />
              )}
            </div>
          )}
        </div>

        {step !== 'run' && (
          <div className="flex justify-between gap-2 border-t border-quanta-smoke pt-4">
            <Button
              onPress={() =>
                step === 1 ? onOpenChange(false) : setStep(step === 3 ? 2 : 1)
              }
            >
              {step === 1 ? t(messages.cancel) : t(messages.back)}
            </Button>
            {step === 1 && (
              <Button
                variant="primary"
                accent
                isDisabled={!choice}
                onPress={() => void toMapping()}
              >
                {t(messages.nextMap)}
              </Button>
            )}
            {step === 2 && (
              <Button
                variant="primary"
                accent
                isDisabled={!preview}
                onPress={() => setStep(3)}
              >
                {t(messages.nextReview)}
              </Button>
            )}
            {step === 3 && (
              <Button variant="primary" accent onPress={() => void run()}>
                {moved
                  ? t(messages.changeWorkflowFor, { items: itemsLabel(moved) })
                  : t(messages.changeWorkflowConfirm)}
              </Button>
            )}
          </div>
        )}
      </Dialog>
    </Modal>
  );
}

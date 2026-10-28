import { useState } from 'react';
import { Button } from '@plone/quanta';
import { useTranslate } from '../../../provider/ControlPanelsProvider';
import { useContentTypesDriver } from '../../driver';
import { messages } from '../../messages';
import type { ContentTypeSettings, WorkflowInfo } from '../../types';
import { ChangeWorkflowDialog } from './ChangeWorkflowDialog';
import { StateBadge, VISIBILITY_LABELS } from './StateBadge';

export interface WorkflowTabProps {
  type: ContentTypeSettings;
  /** The number of items of the type. */
  count: number;
  workflows: WorkflowInfo[];
  /** The site default workflow, `null` when there is none. */
  defaultWorkflow: string | null;
  /** Called after the workflow changed, to load the type again. */
  onChanged: () => void;
}

/**
 * A type's workflow: its states, who sees items in each, and how items move
 * between them. Changing it isn't part of the type's save: it opens its own
 * dialog, because the items need a state mapping.
 */
export function WorkflowTab({
  type,
  count,
  workflows,
  defaultWorkflow,
  onChanged,
}: WorkflowTabProps) {
  const t = useTranslate();
  const { capabilities } = useContentTypesDriver();
  const [isChanging, setIsChanging] = useState(false);

  if (!capabilities.workflows || !type.workflow) {
    return (
      <p className="text-sm text-quanta-pigeon">
        {t(messages.workflowsUnavailable)}
      </p>
    );
  }
  const assignment = type.workflow;
  const workflow = workflows.find((entry) => entry.id === assignment.workflow);
  const stateTitle = (id: string) =>
    workflow?.states.find((state) => state.id === id)?.title ?? id;

  return (
    <div className="flex flex-col gap-6">
      <section
        aria-labelledby="current-workflow"
        className="flex flex-col gap-4 rounded-lg border border-quanta-smoke p-4"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm text-quanta-pigeon">
              {t(messages.currentWorkflow)}
            </span>
            <h3 id="current-workflow" className="font-semibold">
              {workflow?.title ??
                (assignment.workflow === null
                  ? t(messages.noWorkflow)
                  : assignment.workflow)}
            </h3>
          </div>
          <span className="rounded-full border border-quanta-smoke px-2 py-0.5 text-xs">
            {t(
              assignment.followsDefault
                ? messages.followsSiteDefault
                : messages.setForThisType,
            )}
          </span>
        </div>
        {workflow?.description && (
          <p className="text-sm text-quanta-pigeon">{workflow.description}</p>
        )}
        {workflow ? (
          <ul
            aria-label={t(messages.workflowStates)}
            className="flex flex-col divide-y divide-quanta-smoke"
          >
            {workflow.states.map((state) => {
              const transitions = workflow.transitions.filter((transition) =>
                transition.from.includes(state.id),
              );
              return (
                <li
                  key={state.id}
                  className={`
                    grid gap-x-4 gap-y-1 py-2 text-sm
                    sm:grid-cols-[minmax(9rem,auto)_1fr]
                  `}
                >
                  <span className="flex flex-col items-start gap-1">
                    <StateBadge state={state} />
                    {state.id === workflow.initialState && (
                      <span className="text-xs text-quanta-pigeon">
                        {t(messages.initialState)}
                      </span>
                    )}
                  </span>
                  <span className="flex flex-col gap-1">
                    <span>{t(VISIBILITY_LABELS[state.visibility])}</span>
                    {transitions.length > 0 && (
                      <span className="text-xs text-quanta-pigeon">
                        {transitions
                          .map((transition) =>
                            t(messages.transitionTo, {
                              transition: transition.title,
                              state: stateTitle(transition.to),
                            }),
                          )
                          .join(' · ')}
                      </span>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-quanta-pigeon">
            {t(messages.noWorkflowHelp)}
          </p>
        )}
      </section>

      <div className="flex flex-wrap items-center gap-3">
        {capabilities.workflowChange ? (
          <>
            <Button
              variant="primary"
              accent
              onPress={() => setIsChanging(true)}
            >
              {t(messages.changeWorkflow)}
            </Button>
            <span className="text-sm text-quanta-pigeon">
              {t(messages.placefulNote)}
            </span>
          </>
        ) : (
          <span className="text-sm text-quanta-pigeon">
            {t(messages.changeWorkflowUnavailable)}
          </span>
        )}
      </div>

      {capabilities.workflowChange && (
        <ChangeWorkflowDialog
          isOpen={isChanging}
          onOpenChange={setIsChanging}
          types={[
            {
              id: type.id,
              title: type.title,
              kind: type.kind,
              count,
              workflow: type.workflow,
            },
          ]}
          workflows={workflows}
          defaultWorkflow={defaultWorkflow}
          onChanged={onChanged}
        />
      )}
    </div>
  );
}

import type { Message } from '../../../provider/messages';
import { messages } from '../../messages';
import type { StateColor, StateVisibility, WorkflowState } from '../../types';
import { stateColor } from '../../workflow/stateColor';

/** Who can see items in a state, in words. */
export const VISIBILITY_LABELS: Record<StateVisibility, Message> = {
  anyone: messages.visibilityAnyone,
  members: messages.visibilityMembers,
  restricted: messages.visibilityRestricted,
  unknown: messages.visibilityUnknown,
};

const COLOR_STYLES: Record<StateColor, string> = {
  gray: 'border-quanta-silver bg-quanta-snow text-quanta-iron',
  blue: 'border-quanta-sky bg-quanta-arctic text-quanta-royal',
  teal: 'border-quanta-spa bg-quanta-aqua text-quanta-peacock',
  green: 'border-quanta-mint bg-quanta-daiquiri text-quanta-turtle',
  yellow: 'border-quanta-banana bg-quanta-cream text-quanta-bronze',
  red: 'border-quanta-flamingo bg-quanta-ballet text-quanta-wine',
};

/** A workflow state's title, in the state's color. */
export function StateBadge({ state }: { state: WorkflowState }) {
  return (
    <span
      data-color={stateColor(state)}
      className={`
        inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium
        whitespace-nowrap
        ${COLOR_STYLES[stateColor(state)]}
      `}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {state.title}
    </span>
  );
}

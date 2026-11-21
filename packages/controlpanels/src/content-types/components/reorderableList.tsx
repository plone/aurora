import {
  Button as RACButton,
  DropIndicator,
  type DropTarget,
} from 'react-aria-components';
import { DraggableIcon } from '@plone/icons';

/** Shared pieces of the reorderable lists (fields, fieldsets, behaviors). */

export const listStyles = `
  flex min-w-0 flex-col overflow-auto rounded-lg border border-quanta-smoke
  data-[focus-visible]:outline-2 data-[focus-visible]:outline-quanta-sapphire
`;

export const rowStyles = ({
  isSelected,
  isFocusVisible,
  isDragging,
  isDropTarget,
}: {
  isSelected?: boolean;
  isFocusVisible?: boolean;
  isDragging?: boolean;
  isDropTarget?: boolean;
}) =>
  [
    'flex items-center gap-3 border-b border-quanta-smoke px-3 py-2 text-sm outline-none',
    'last:border-b-0',
    isSelected ? 'bg-quanta-snow font-semibold' : 'hover:bg-quanta-air',
    isFocusVisible ? '-outline-offset-2 outline-2 outline-quanta-sapphire' : '',
    isDragging ? 'opacity-50' : '',
    isDropTarget ? 'bg-quanta-snow' : '',
  ].join(' ');

export const renderDropIndicator = (target: DropTarget) => (
  <DropIndicator
    target={target}
    className={({ isDropTarget }) =>
      `h-0.5 ${isDropTarget ? 'bg-quanta-sapphire' : 'bg-transparent'}`
    }
  />
);

/** Rows that can't move get a disabled handle, like the design's dimmed grip. */
export function DragHandle({
  label,
  isDisabled,
}: {
  label: string;
  isDisabled?: boolean;
}) {
  return (
    <RACButton
      slot="drag"
      aria-label={label}
      isDisabled={isDisabled}
      className={`
        flex shrink-0 cursor-grab rounded text-quanta-iron outline-none
        data-[disabled]:cursor-default data-[disabled]:opacity-35
        data-[focus-visible]:outline-2 data-[focus-visible]:outline-quanta-sapphire
      `}
    >
      <DraggableIcon size="sm" aria-hidden />
    </RACButton>
  );
}

import { useId, type MouseEvent } from 'react';
import type { TElement } from 'platejs';

import {
  ChevronLeftIcon,
  GripVerticalIcon,
  ChevronRightIcon,
  CopyIcon,
  PlusIcon,
  Trash2Icon,
  Settings2Icon,
} from 'lucide-react';
import { PathApi, RangeApi } from 'platejs';
import { useEditorRef, useEditorSelector } from 'platejs/react';

import { cn } from '../../lib/utils';
import {
  addColumnAt,
  deleteColumn,
  duplicateColumn,
  moveColumnBy,
} from '../editor/plugins/grid/column-actions';
import { findGridNodePath } from '../editor/plugins/grid/editor-transforms';
import { getGridOptions } from '../editor/plugins/grid/options';
import type { TGridColumnElement } from '../editor/plugins/grid/types';
import { useTranslation } from '../editor/plugins/i18n';
import { usePlateHost } from '../editor/plate-host-context';
import { BlockSettingsTrigger, focusSettingsFrom } from './block-settings';
import {
  getSettingsTarget,
  setSettingsTarget,
} from '../editor/plugins/block-settings';
import { getFocusableControls } from '../../lib/focusable';
import { GRID_COLUMN_KEY } from '../editor/plugins/grid/types';
import { Button } from './button';

/*
 * The column handle, in the strip each column reserves at its top, and the
 * insert points in the gaps between columns and at the outer edges.
 */

type ColumnState = {
  index: number;
  total: number;
  /** The caret is in the column. */
  active: boolean;
  /** Text is selected: the formatting toolbar shows instead. */
  textSelected: boolean;
};

/** Where a column is and what's selected, read on every change. */
const useColumnState = (element: TElement): ColumnState | undefined => {
  const state = useEditorSelector(
    (editor) => {
      const path = findGridNodePath(editor as any, element);
      if (!path) return '';
      const grid = editor.api.parent(path)?.[0] as TElement | undefined;
      const selection = editor.selection;
      const active =
        !!selection &&
        PathApi.isAncestor(path, selection.anchor.path) &&
        PathApi.isAncestor(path, selection.focus.path);
      const textSelected = !!selection && !RangeApi.isCollapsed(selection);
      return [
        path.at(-1) ?? 0,
        grid?.children.length ?? 1,
        active ? 1 : 0,
        textSelected ? 1 : 0,
      ].join('|');
    },
    [element],
  );
  if (!state) return undefined;
  const [index, total, active, textSelected] = state.split('|').map(Number);
  return {
    index,
    total,
    active: active === 1,
    textSelected: textSelected === 1,
  };
};

const keepCaret = (event: MouseEvent) => event.preventDefault();

/** Move left, Move right, Duplicate and Delete for a column. */
export function GridColumnHandle({
  element,
  gripRef,
}: {
  element: TGridColumnElement;
  /** Connects the grip to the column's drag and drop. */
  gripRef?: (node: any) => void;
}) {
  const editor = useEditorRef();
  const { t } = useTranslation();
  const { settingsContainer } = usePlateHost();
  const gripHintId = useId();
  const state = useColumnState(element);
  // Without a host sidebar, the grid's settings open in a popover from here.
  const gridId = useEditorSelector(
    (ed) => {
      const path = findGridNodePath(ed as any, element);
      const grid = path ? ed.api.parent(path)?.[0] : undefined;
      return grid ? String((grid as TElement).id ?? '') : '';
    },
    [element],
  );
  if (!state || state.textSelected) return null;

  const { index, total, active } = state;
  const gripLabel = t('plate.grid.dragColumn', {
    defaultValue: 'Drag to reorder column {{position}}',
    position: index + 1,
  });
  const full = total >= getGridOptions(editor).maxColumns;
  const pathOf = () => findGridNodePath(editor as any, element);

  const actions = [
    {
      key: 'left',
      icon: <ChevronLeftIcon />,
      label: t('plate.grid.moveLeft', { defaultValue: 'Move left' }),
      disabled: index === 0,
      run: (path: number[]) => moveColumnBy(editor as any, path, -1),
    },
    {
      key: 'right',
      icon: <ChevronRightIcon />,
      label: t('plate.grid.moveRight', { defaultValue: 'Move right' }),
      disabled: index >= total - 1,
      run: (path: number[]) => moveColumnBy(editor as any, path, 1),
    },
    {
      key: 'duplicate',
      icon: <CopyIcon />,
      label: full
        ? t('plate.grid.duplicateFull', {
            defaultValue: 'The grid has its most columns',
          })
        : t('plate.grid.duplicateColumn', {
            defaultValue: 'Duplicate column',
          }),
      disabled: full,
      run: (path: number[]) => duplicateColumn(editor as any, path),
    },
    {
      key: 'delete',
      icon: <Trash2Icon />,
      label:
        total <= 1
          ? t('plate.grid.deleteOnly', {
              defaultValue: 'A grid needs at least one column',
            })
          : t('plate.grid.deleteColumn', { defaultValue: 'Delete column' }),
      disabled: total <= 1,
      danger: true,
      run: (path: number[]) => deleteColumn(editor as any, path),
    },
  ];

  return (
    <div
      contentEditable={false}
      role="toolbar"
      aria-label={t('plate.grid.columnOf', {
        defaultValue: 'Column {{position}} of {{total}}',
        position: index + 1,
        total,
      })}
      data-active={active ? 'true' : 'false'}
      data-grid-column-handle=""
      // A keyboard user reaching the handle selects its column, so the
      // settings show it, and Tab from its last control goes on to them.
      onFocus={() => {
        const target = getSettingsTarget(editor as any);
        if (
          target?.type !== GRID_COLUMN_KEY ||
          (target as any).id !== element.id
        ) {
          setSettingsTarget(editor as any, {
            type: GRID_COLUMN_KEY,
            id: element.id,
          });
        }
      }}
      onKeyDown={(event) => {
        if (event.key !== 'Tab' || event.shiftKey || event.defaultPrevented) {
          return;
        }
        const controls = getFocusableControls(event.currentTarget);
        if (event.target !== controls.at(-1)) return;
        if (
          focusSettingsFrom(
            editor,
            settingsContainer?.(),
            event.target as HTMLElement,
          )
        ) {
          event.preventDefault();
        }
      }}
      className={cn(
        `
          absolute top-1 left-1/2 z-10 flex -translate-x-1/2 items-center gap-0.5 rounded-full
          border bg-background p-0.5 shadow-sm select-none
        `,
        `
          opacity-0 transition-opacity
          group-hover/column:opacity-100
          focus-within:opacity-100
          data-[active=true]:opacity-100
        `,
      )}
    >
      {gripRef && (
        <Button
          ref={gripRef}
          type="button"
          variant="ghost"
          size="icon"
          className={`
            size-6 cursor-grab rounded-full
            [&_svg]:size-3.5
          `}
          aria-label={gripLabel}
          aria-describedby={gripHintId}
          title={gripLabel}
        >
          <GripVerticalIcon />
        </Button>
      )}
      <span id={gripHintId} className="sr-only">
        {t('plate.grid.dragHint', {
          defaultValue: 'Or press Alt+Shift+Left or Right in the column.',
        })}
      </span>
      {!settingsContainer && gridId && (
        <BlockSettingsTrigger
          target={{ type: 'grid', id: gridId }}
          label={t('plate.grid.gridSettings', {
            defaultValue: 'Grid settings',
          })}
          className={`
            size-6 rounded-full
            [&_svg]:size-3.5
          `}
        >
          <Settings2Icon />
        </BlockSettingsTrigger>
      )}
      {actions.map((action) => (
        <Button
          key={action.key}
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            `
              size-6 rounded-full
              [&_svg]:size-3.5
            `,
            action.danger && 'hover:bg-destructive/10 hover:text-destructive',
          )}
          aria-label={action.label}
          title={action.label}
          disabled={action.disabled}
          onMouseDown={keepCaret}
          onClick={() => {
            const path = pathOf();
            if (path) action.run(path);
          }}
        >
          {action.icon}
        </Button>
      ))}
    </div>
  );
}

/**
 * An insert point next to a column: in the gap before it, or at the grid's
 * outer edge after the last column. Hovering it shows a line and a +.
 * Pointer only: the column settings and Alt+Shift+arrows do the same from
 * the keyboard.
 */
export function GridInsertSeam({
  element,
  side,
}: {
  element: TGridColumnElement;
  side: 'before' | 'after';
}) {
  const editor = useEditorRef();
  const { t } = useTranslation();
  const state = useColumnState(element);
  if (!state || state.total >= getGridOptions(editor).maxColumns) return null;
  // Only the last column has an insert point after it.
  if (side === 'after' && state.index !== state.total - 1) return null;

  const position = side === 'before' ? state.index : state.index + 1;
  const label = t('plate.grid.insertColumn', {
    defaultValue: 'Insert a column at position {{position}}',
    position: position + 1,
  });

  return (
    <div
      contentEditable={false}
      data-grid-insert-seam={side}
      className={cn(
        `
          group/seam absolute top-0 bottom-0 z-10 flex w-4 -translate-x-1/2 items-center
          justify-center select-none
        `,
        side === 'before'
          ? 'left-[calc(var(--block-grid-gap)/-2)]'
          : 'left-[calc(100%+var(--block-grid-gap)/2)]',
        `
          before:absolute before:inset-y-0 before:left-1/2 before:w-0.5 before:-translate-x-1/2
          before:bg-primary before:opacity-0
          hover:before:opacity-40
        `,
      )}
    >
      <button
        type="button"
        tabIndex={-1}
        aria-label={label}
        title={label}
        onMouseDown={keepCaret}
        onClick={() => {
          const path = findGridNodePath(editor as any, element);
          if (path) addColumnAt(editor as any, PathApi.parent(path), position);
        }}
        className={`
          relative grid size-5 place-items-center rounded-full border border-primary bg-background
          text-primary opacity-0 transition-opacity
          group-hover/seam:opacity-100
          [&_svg]:size-3
        `}
      >
        <PlusIcon />
      </button>
    </div>
  );
}

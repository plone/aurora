import * as React from 'react';

import type { Path } from 'platejs';

import { MinusIcon, PlusIcon } from 'lucide-react';
import { PathApi } from 'platejs';
import { useEditorRef } from 'platejs/react';

import { announce } from '../../lib/announce';
import { showUndoToast } from '../../lib/undo-toast';
import { cn } from '../../lib/utils';
import type { NodeSettingsProps } from '../editor/plugins/block-settings';
import {
  addColumnAt,
  deleteColumn,
  duplicateColumn,
  moveColumnBy,
} from '../editor/plugins/grid/column-actions';
import { findGridNodePath } from '../editor/plugins/grid/editor-transforms';
import {
  findMatchingLayout,
  getGridLayouts,
  getGridOptions,
  GRID_GAPS,
} from '../editor/plugins/grid/options';
import {
  applyGridLayout,
  getGridSizes,
  setGridColumnCount,
} from '../editor/plugins/grid/transforms';
import type {
  GridGap,
  TGridColumnElement,
  TGridElement,
} from '../editor/plugins/grid/types';
import { useTranslation } from '../editor/plugins/i18n';
import { SettingsBreadcrumb } from './block-settings';
import { Button } from './button';
import { Input } from './input';

/*
 * The settings of a grid and of its columns. They render in the host's
 * settings container, such as a sidebar, or in a popover.
 */

const fieldClass = 'flex flex-col gap-1.5';
const labelClass = 'text-sm font-medium';
const hintClass = 'text-xs text-muted-foreground';
const groupClass = 'flex flex-col gap-3 border-t pt-4';
const choiceClass = `
  flex min-h-10 cursor-pointer items-center gap-2 rounded-md border bg-background
  px-2 py-1.5 text-sm
  has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring
`;

type Choice<T extends string> = {
  value: T;
  label: React.ReactNode;
  /** The accessible name, when the visible label isn't text. */
  name?: string;
};

/**
 * A group of choices as native radio buttons, so the arrow keys move and
 * select, and screen readers announce the group and the choice.
 */
function ChoiceGroup<T extends string>({
  legend,
  name,
  value,
  choices,
  onChange,
}: {
  legend: string;
  name: string;
  value: T | undefined;
  choices: Choice<T>[];
  onChange: (value: T) => void;
}) {
  return (
    <fieldset className={groupClass}>
      <legend className={cn(labelClass, 'float-left mb-3 w-full')}>
        {legend}
      </legend>
      <div className="flex flex-wrap gap-2">
        {choices.map((choice) => {
          const checked = choice.value === value;
          return (
            <label
              key={choice.value}
              className={cn(
                choiceClass,
                checked && 'border-primary ring-1 ring-primary',
              )}
            >
              <input
                type="radio"
                name={name}
                value={choice.value}
                checked={checked}
                aria-label={choice.name}
                className="sr-only"
                onChange={() => onChange(choice.value)}
              />
              {choice.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

/** A layout drawn as bars in proportion to the column weights. */
function LayoutBars({ layout }: { layout: number[] }) {
  return (
    <span aria-hidden="true" className="flex h-4 w-12 gap-0.5">
      {layout.map((size, index) => (
        <span
          key={index}
          className="block rounded-sm bg-current opacity-60"
          style={{ flex: size }}
        />
      ))}
    </span>
  );
}

/** Runs a change, merging consecutive ones into one undo step. */
const withMerging = (editor: any, change: () => void) => {
  if (typeof editor.tf.withMerging === 'function')
    editor.tf.withMerging(change);
  else change();
};

export function GridSettings({
  grid,
  path,
}: {
  grid: TGridElement;
  path: Path;
}) {
  const editor = useEditorRef();
  const { t } = useTranslation();
  const options = getGridOptions(editor);
  const count = grid.children.length;
  const layouts = getGridLayouts(options, count);
  const active = findMatchingLayout(getGridSizes(grid), layouts);
  const headlineId = React.useId();
  const gridPath = () => findGridNodePath(editor as any, grid) ?? path;

  const columnsLabel = (value: number) =>
    value === 1
      ? t('plate.grid.oneColumn', { defaultValue: '1 column' })
      : t('plate.grid.columnCount', {
          defaultValue: '{{count}} columns',
          count: value,
        });

  const setCount = (next: number) => {
    const at = gridPath();
    const removed = grid.children[count - 1];
    const hadContent =
      next < count &&
      removed.children.some(
        (block: any) =>
          block.type !== 'p' || block.children.some((child: any) => child.text),
      );
    if (!setGridColumnCount(editor as any, at, next)) return;
    if (hadContent) {
      showUndoToast(
        editor as any,
        t('plate.grid.columnMerged', {
          defaultValue: 'The content of column {{from}} moved to column {{to}}',
          from: count,
          to: next,
        }),
      );
    }
    announce(columnsLabel(next));
  };

  const deleteGrid = () => {
    const at = gridPath();
    editor.tf.removeNodes({ at });
    const next = editor.api.node(at) ? at : PathApi.previous(at);
    if (next && editor.api.node(next)) {
      editor.tf.select(editor.api.start(next)!);
    }
    editor.tf.focus();
    showUndoToast(
      editor as any,
      t('plate.grid.gridDeleted', { defaultValue: 'Grid deleted' }),
    );
  };

  const set = (patch: Record<string, unknown>) =>
    editor.tf.setNodes(patch, { at: gridPath() });

  const gapNames: Record<GridGap, string> = {
    s: t('plate.grid.gapSmall', { defaultValue: 'Small' }),
    m: t('plate.grid.gapMedium', { defaultValue: 'Medium' }),
    l: t('plate.grid.gapLarge', { defaultValue: 'Large' }),
  };

  return (
    <div className="flex flex-col gap-4" data-grid-settings="">
      <SettingsBreadcrumb path={path} />
      <div>
        <h2 className="text-lg font-semibold">
          {t('plate.grid.label', { defaultValue: 'Grid' })}
        </h2>
        <p className={hintClass}>{columnsLabel(count)}</p>
      </div>

      <div className={groupClass}>
        <span className={labelClass} id={`${headlineId}-columns`}>
          {t('plate.grid.columns', { defaultValue: 'Columns' })}
        </span>
        <div
          role="group"
          aria-labelledby={`${headlineId}-columns`}
          className="flex items-center gap-2"
        >
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-8"
            aria-label={t('plate.grid.removeLastColumn', {
              defaultValue: 'Remove the last column',
            })}
            disabled={count <= 1}
            onClick={() => setCount(count - 1)}
          >
            <MinusIcon />
          </Button>
          <output
            aria-live="polite"
            className="min-w-6 text-center font-mono text-sm"
          >
            {count}
          </output>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-8"
            aria-label={t('plate.grid.addColumnAtEnd', {
              defaultValue: 'Add a column at the end',
            })}
            disabled={count >= options.maxColumns}
            onClick={() => setCount(count + 1)}
          >
            <PlusIcon />
          </Button>
        </div>
      </div>

      {layouts.length > 1 && (
        <ChoiceGroup
          legend={t('plate.grid.layout', { defaultValue: 'Layout' })}
          name={`grid-${grid.id}-layout`}
          value={active >= 0 ? String(active) : undefined}
          choices={layouts.map((layout, index) => ({
            value: String(index),
            name: t('plate.grid.layoutName', {
              defaultValue: 'Widths {{ratio}}',
              ratio: layout.join(':'),
            }),
            label: (
              <>
                <LayoutBars layout={layout} />
                <span aria-hidden="true">{layout.join(':')}</span>
              </>
            ),
          }))}
          onChange={(value) =>
            applyGridLayout(editor as any, gridPath(), layouts[Number(value)])
          }
        />
      )}

      {options.themes.length > 1 && (
        <ChoiceGroup
          legend={t('plate.grid.background', { defaultValue: 'Background' })}
          name={`grid-${grid.id}-background`}
          value={grid.theme}
          choices={options.themes.map((theme) => ({
            value: theme.name,
            label: (
              <>
                <span
                  aria-hidden="true"
                  className="block size-6 rounded-full border"
                  style={{
                    background:
                      (theme.style as Record<string, string>)?.[
                        '--theme-color'
                      ] ?? 'transparent',
                  }}
                />
                {t(`plate.grid.themes.${theme.name}`, {
                  defaultValue: theme.label,
                })}
              </>
            ),
          }))}
          onChange={(value) => set({ theme: value })}
        />
      )}

      <div className={cn(groupClass, fieldClass)}>
        <label htmlFor={headlineId} className={labelClass}>
          {t('plate.grid.headline', { defaultValue: 'Headline' })}
        </label>
        <Input
          id={headlineId}
          value={grid.headline ?? ''}
          placeholder={t('plate.grid.optional', { defaultValue: 'Optional' })}
          onChange={(event) => {
            const headline = event.target.value;
            withMerging(editor, () =>
              headline
                ? set({ headline })
                : editor.tf.unsetNodes('headline', { at: gridPath() }),
            );
          }}
        />
      </div>

      <ChoiceGroup
        legend={t('plate.grid.gap', { defaultValue: 'Gap' })}
        name={`grid-${grid.id}-gap`}
        value={grid.gap}
        choices={GRID_GAPS.map((gap) => ({
          value: gap,
          name: gapNames[gap],
          label: <span aria-hidden="true">{gap.toUpperCase()}</span>,
        }))}
        onChange={(value) => set({ gap: value })}
      />

      <ChoiceGroup
        legend={t('plate.grid.narrowWidths', {
          defaultValue: 'On narrow widths',
        })}
        name={`grid-${grid.id}-stack`}
        value={grid.stack === false ? 'row' : 'stack'}
        choices={[
          {
            value: 'stack',
            label: t('plate.grid.stack', { defaultValue: 'Stack' }),
          },
          {
            value: 'row',
            label: t('plate.grid.keepRow', { defaultValue: 'Keep in a row' }),
          },
        ]}
        onChange={(value) => set({ stack: value === 'stack' })}
      />
      <p className={cn(hintClass, '-mt-2')}>
        {t('plate.grid.stackHint', {
          defaultValue:
            "Stacking follows the grid's own width, not the screen's.",
        })}
      </p>

      <div className={groupClass}>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="self-start text-destructive"
          onClick={deleteGrid}
        >
          {t('plate.grid.deleteGrid', { defaultValue: 'Delete grid' })}
        </Button>
      </div>
    </div>
  );
}

export function GridColumnSettings({
  column,
  path,
}: {
  column: TGridColumnElement;
  path: Path;
}) {
  const editor = useEditorRef();
  const { t } = useTranslation();
  const gridNode = editor.api.node(PathApi.parent(path))?.[0] as
    TGridElement | undefined;
  if (!gridNode) return null;

  const index = path.at(-1) ?? 0;
  const total = gridNode.children.length;
  const parts = getGridSizes(gridNode).reduce((sum, size) => sum + size, 0);
  const full = total >= getGridOptions(editor).maxColumns;
  const columnPath = () => findGridNodePath(editor as any, column) ?? path;
  const gridPath = () => PathApi.parent(columnPath());

  const actions = [
    {
      label: t('plate.grid.moveLeft', { defaultValue: 'Move left' }),
      disabled: index === 0,
      run: () => moveColumnBy(editor as any, columnPath(), -1),
    },
    {
      label: t('plate.grid.moveRight', { defaultValue: 'Move right' }),
      disabled: index >= total - 1,
      run: () => moveColumnBy(editor as any, columnPath(), 1),
    },
    {
      label: t('plate.grid.addBefore', { defaultValue: 'Add column before' }),
      disabled: full,
      run: () =>
        addColumnAt(editor as any, gridPath(), columnPath().at(-1) ?? 0),
    },
    {
      label: t('plate.grid.addAfter', { defaultValue: 'Add column after' }),
      disabled: full,
      run: () =>
        addColumnAt(editor as any, gridPath(), (columnPath().at(-1) ?? 0) + 1),
    },
    {
      label: t('plate.grid.duplicateColumn', {
        defaultValue: 'Duplicate column',
      }),
      disabled: full,
      run: () => duplicateColumn(editor as any, columnPath()),
    },
    {
      label: t('plate.grid.deleteColumn', { defaultValue: 'Delete column' }),
      disabled: total <= 1,
      danger: true,
      run: () => deleteColumn(editor as any, columnPath()),
    },
  ];

  return (
    <div className="flex flex-col gap-4" data-grid-column-settings="">
      <SettingsBreadcrumb path={path} />
      <div>
        <h2 className="text-lg font-semibold">
          {t('plate.grid.columnOf', {
            defaultValue: 'Column {{position}} of {{total}}',
            position: index + 1,
            total,
          })}
        </h2>
        <p className={hintClass}>
          {t('plate.grid.columnWidth', {
            defaultValue:
              'Width: {{size}} of {{parts}} parts, set by the grid layout.',
            size: column.size ?? 1,
            parts,
          })}
        </p>
      </div>
      <div className={groupClass}>
        <span className={labelClass}>
          {t('plate.grid.columnActions', { defaultValue: 'Column actions' })}
        </span>
        <div className="flex flex-wrap gap-1.5">
          {actions.map((action) => (
            <Button
              key={action.label}
              type="button"
              variant="outline"
              size="sm"
              className={cn(action.danger && 'text-destructive')}
              disabled={action.disabled}
              onClick={action.run}
            >
              {action.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

/** The grid's settings form, as its selection level declares it. */
export function GridSettingsLevelForm({ node, path }: NodeSettingsProps) {
  return <GridSettings grid={node as TGridElement} path={path} />;
}

/** A column's settings form, as its selection level declares it. */
export function GridColumnSettingsLevelForm({ node, path }: NodeSettingsProps) {
  return <GridColumnSettings column={node as TGridColumnElement} path={path} />;
}

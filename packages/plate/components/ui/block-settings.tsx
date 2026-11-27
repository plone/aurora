import * as React from 'react';

import type { Path, TElement } from 'platejs';

import { createPortal } from 'react-dom';
import { PLONE_BLOCK_TYPE } from '@plone/helpers';
import {
  useEditorRef,
  useEditorSelection,
  useEditorSelector,
  usePluginOption,
} from 'platejs/react';

import { getFocusableControls } from '../../lib/focusable';
import { cn } from '../../lib/utils';
import { usePlateHost } from '../editor/plate-host-context';
import {
  BlockSettingsPlugin,
  findSettingsTargetEntry,
  getNodeSettings,
  getOutermostSettingsLevel,
  getSettingsEntry,
  getSettingsLevels,
  getSettingsOrigin,
  PAGE_SETTINGS_TARGET,
  setSettingsOrigin,
  setSettingsTarget,
  type NodeSettingsTarget,
} from '../editor/plugins/block-settings';
import {
  getBlockLabel,
  getInnerBlockEntry,
  getSlotOfBlock,
  isInnerBlockPath,
  moveInnerBlock,
  removeInnerBlock,
} from '../editor/plugins/containers';
import { createEmptyParagraph } from '../editor/plugins/containers/inner-blocks';
import { useTranslation } from '../editor/plugins/i18n';
import { Button } from './button';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

/*
 * The settings of the nodes that declare them (see `BlockSettingsPlugin`).
 * They render in the host's settings container, such as a sidebar, when
 * `PlateEditor` gets one, and in a popover next to the node otherwise.
 */

const labelClass = 'text-sm font-medium';
const hintClass = 'text-xs text-muted-foreground';
const groupClass = 'flex flex-col gap-3 border-t pt-4';
const crumbClass =
  'rounded-sm px-1 py-0.5 text-primary underline-offset-2 hover:underline';

/** The node or the page whose settings the user chose to see, if any. */
export const useSettingsTarget = () =>
  usePluginOption(BlockSettingsPlugin, 'target');

function Separator() {
  return (
    <li aria-hidden="true" className="text-muted-foreground">
      ›
    </li>
  );
}

function CurrentCrumb({ children }: { children: React.ReactNode }) {
  return (
    <li>
      <span aria-current="location" className="px-1 font-semibold">
        {children}
      </span>
    </li>
  );
}

/**
 * Page › … › the current level: the levels above a node, each a button that
 * selects it. `current` names the last level when it isn't a node with
 * settings, such as an image inside a panel.
 */
export function SettingsBreadcrumb({
  path,
  current,
}: {
  /** The path of the selected node. Without it, the page is current. */
  path?: Path;
  /** The name of the selected node, when it has no level of its own. */
  current?: string;
}) {
  const editor = useEditorRef();
  const { t } = useTranslation();
  const levels = path
    ? getSettingsLevels(editor, path, { includeSelf: current === undefined })
    : [];
  const pageLabel = t('plate.blockSettings.page', { defaultValue: 'Page' });
  const last = current === undefined ? levels.at(-1) : undefined;
  const above = last ? levels.slice(0, -1) : levels;

  return (
    <nav
      aria-label={t('plate.blockSettings.selection', {
        defaultValue: 'Selection',
      })}
    >
      <ol className="flex flex-wrap items-center gap-1 text-sm">
        {!path ? (
          <CurrentCrumb>{pageLabel}</CurrentCrumb>
        ) : (
          <>
            <li>
              <button
                type="button"
                className={crumbClass}
                onClick={() =>
                  setSettingsTarget(editor, { type: PAGE_SETTINGS_TARGET })
                }
              >
                {pageLabel}
              </button>
            </li>
            {above.map((level) => (
              <React.Fragment key={`${level.type}:${level.id}`}>
                <Separator />
                <li>
                  <button
                    type="button"
                    className={crumbClass}
                    onClick={() =>
                      setSettingsTarget(editor, {
                        type: level.type,
                        id: level.id,
                      })
                    }
                  >
                    {level.label}
                  </button>
                </li>
              </React.Fragment>
            ))}
            {(last || current !== undefined) && (
              <>
                <Separator />
                <CurrentCrumb>{last ? last.label : current}</CurrentCrumb>
              </>
            )}
          </>
        )}
      </ol>
    </nav>
  );
}

/** What the settings show at the page level: how to choose a level. */
export function PageSettingsHint() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-4">
      <SettingsBreadcrumb />
      <p className={hintClass}>
        {t('plate.blockSettings.pageHint', {
          defaultValue:
            'Click a block, or the frame or label of a block that holds other blocks, such as an accordion, to see its settings here.',
        })}
      </p>
    </div>
  );
}

/**
 * For a block inside a container: the levels above it, its position in its
 * slot, and an optional note. A host renders it above the block's settings.
 * It renders nothing for blocks outside a container.
 */
export function InnerBlockSettingsHeader({
  path,
  blockLabel,
  note,
}: {
  path: Path;
  blockLabel: string;
  note?: string;
}) {
  const editor = useEditorRef();
  const { t } = useTranslation();
  const slot = getSlotOfBlock(editor, path);
  if (!slot) return null;

  const level = getSettingsLevels(editor, path).at(-1);
  const declaration = level && getNodeSettings(editor, level.type);
  const place = level
    ? (declaration?.placeLabel?.(t, level.node, editor) ?? level.label)
    : '';
  const index = path.at(-1) ?? 0;
  const total = slot[0].children.length;

  return (
    <div className="mb-4 flex flex-col gap-2" data-block-settings-header="">
      <SettingsBreadcrumb path={path} current={blockLabel} />
      <p className={hintClass}>
        {t('plate.blockSettings.blockPosition', {
          defaultValue: 'Block {{position}} of {{total}} in {{place}}',
          position: index + 1,
          total,
          place,
        })}
      </p>
      {note && <p className="text-sm text-muted-foreground">{note}</p>}
    </div>
  );
}

/**
 * For a block inside a container: Move up, Move down and Delete. A host
 * renders it below the block's settings. It renders nothing for blocks
 * outside a container.
 */
export function InnerBlockSettingsActions({ path }: { path: Path }) {
  const editor = useEditorRef();
  const { t } = useTranslation();
  // Read on every change, so the buttons follow the block's position.
  const total = useEditorSelector(
    (ed) =>
      isInnerBlockPath(ed, path)
        ? ((ed.api.parent(path)?.[0] as TElement | undefined)?.children
            .length ?? 0)
        : 0,
    [path.join('.')],
  );
  if (!total) return null;
  const index = path.at(-1) ?? 0;

  return (
    <div className={cn(groupClass, 'mt-4')} data-block-settings-actions="">
      <span className={labelClass}>
        {t('plate.blockSettings.blockActions', {
          defaultValue: 'Block actions',
        })}
      </span>
      <div className="flex flex-wrap gap-1.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={index === 0}
          onClick={() => moveInnerBlock(editor, path, -1)}
        >
          {t('plate.blockSettings.moveUp', { defaultValue: 'Move up' })}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={index === total - 1}
          onClick={() => moveInnerBlock(editor, path, 1)}
        >
          {t('plate.blockSettings.moveDown', { defaultValue: 'Move down' })}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="text-destructive"
          onClick={() => removeInnerBlock(editor, path)}
        >
          {t('plate.blockSettings.delete', { defaultValue: 'Delete' })}
        </Button>
      </div>
    </div>
  );
}

/** The settings form a node declares, if any. */
export function BlockSettingsForm({
  node,
  path,
}: {
  node: TElement;
  path: Path;
}) {
  const editor = useEditorRef();
  const Component = getNodeSettings(editor, node.type)?.component;
  return Component ? <Component node={node} path={path} /> : null;
}

/** Puts the caret after a block, adding an empty paragraph if needed. */
const moveCaretAfter = (editor: any, path: Path) => {
  const next = [...path.slice(0, -1), (path.at(-1) ?? 0) + 1];
  if (!editor.api.node(next)) {
    editor.tf.insertNodes(createEmptyParagraph(), { at: next });
  }
  editor.tf.select(editor.api.start(next));
  editor.tf.focus();
};

/**
 * Renders the settings of the chosen node, or of the level the selection
 * implies, in the host's settings container. Without one, they open in
 * popovers instead (see `BlockSettingsTrigger`).
 */
export function BlockSettingsHost() {
  const editor = useEditorRef();
  const { settingsContainer } = usePlateHost();
  const target = useSettingsTarget();
  const selection = useEditorSelection();
  const entry = useEditorSelector(
    (ed) => getSettingsEntry(ed),
    [target, selection],
  );

  // Tab reaches the settings from a block's controls. From the last control
  // of the settings container, Tab goes to the block's control after the one
  // that led here, such as the next column's handle, or else to the text
  // after the block. Shift+Tab from its first control goes back to the
  // control that led here, or else to the block's last control.
  React.useEffect(() => {
    const container = settingsContainer?.();
    if (!container) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || event.defaultPrevented) return;
      const controls = getFocusableControls(container);
      const edge = event.shiftKey ? controls[0] : controls.at(-1);
      if (event.target !== edge) return;
      const level = getOutermostSettingsLevel(editor);
      if (!level) return;
      const element = editor.api.toDOMNode(level.node);
      const blockControls = element ? getFocusableControls(element) : [];
      const origin = getSettingsOrigin(editor);
      const from = origin ? blockControls.indexOf(origin) : -1;
      if (!event.shiftKey) {
        event.preventDefault();
        const next = from >= 0 ? blockControls[from + 1] : undefined;
        setSettingsOrigin(editor, null);
        if (next) next.focus();
        else moveCaretAfter(editor, level.path);
        return;
      }
      const back = from >= 0 ? origin : blockControls.at(-1);
      if (back) {
        event.preventDefault();
        back.focus();
      }
    };
    container.addEventListener('keydown', onKeyDown);
    return () => container.removeEventListener('keydown', onKeyDown);
  }, [editor, settingsContainer, entry]);

  // A block inside a container without settings of its own, such as text,
  // shows its place and its actions. The host renders those of blocks with
  // settings, such as Plone blocks, around their settings form.
  const innerBlockKey = useEditorSelector(
    (ed) => {
      if (target) return '';
      const block = getInnerBlockEntry(ed);
      return block && block[0].type !== PLONE_BLOCK_TYPE
        ? block[1].join('.')
        : '';
    },
    [target, selection],
  );

  if (!settingsContainer) return null;
  const container = settingsContainer();
  if (!container) return null;

  let content: React.ReactNode = null;
  if (target?.type === PAGE_SETTINGS_TARGET) {
    content = <PageSettingsHint />;
  } else if (entry && getNodeSettings(editor, entry[0].type)?.component) {
    content = <BlockSettingsForm node={entry[0]} path={entry[1]} />;
  } else if (innerBlockKey) {
    const path = innerBlockKey.split('.').map(Number);
    const block = editor.api.node(path)?.[0];
    content = (
      <>
        <InnerBlockSettingsHeader
          path={path}
          blockLabel={getBlockLabel(editor, block)}
        />
        <InnerBlockSettingsActions path={path} />
      </>
    );
  }
  if (!content) return null;

  return createPortal(
    <div className="p-4" data-block-settings="">
      {content}
    </div>,
    container,
  );
}

/**
 * Opens the settings of a node: in the host's settings container when there
 * is one, in a popover otherwise.
 */
export function BlockSettingsTrigger({
  target,
  label,
  children,
  className,
  variant = 'ghost',
  size = 'icon',
}: {
  target: NodeSettingsTarget;
  label: string;
  children: React.ReactNode;
  className?: string;
  variant?: React.ComponentProps<typeof Button>['variant'];
  size?: React.ComponentProps<typeof Button>['size'];
}) {
  const editor = useEditorRef();
  const { settingsContainer } = usePlateHost();
  const [open, setOpen] = React.useState(false);
  const entry = useEditorSelector(
    (ed) => (open ? findSettingsTargetEntry(ed, target) : undefined),
    [open, target.id, target.type],
  );

  const button = (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      aria-label={label}
      title={label}
      onMouseDown={(event) => event.preventDefault()}
      onClick={
        settingsContainer ? () => setSettingsTarget(editor, target) : undefined
      }
    >
      {children}
    </Button>
  );

  if (settingsContainer) return button;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{button}</PopoverTrigger>
      <PopoverContent
        align="end"
        className="max-h-[70vh] w-96 overflow-y-auto"
        aria-label={label}
      >
        {entry && <BlockSettingsForm node={entry[0]} path={entry[1]} />}
      </PopoverContent>
    </Popover>
  );
}

/**
 * Moves the keyboard focus from a control on the canvas into the host's
 * settings container, and remembers the control so Tab comes back next to
 * it. Returns `false` when the host has no container with controls.
 */
export const focusSettingsFrom = (
  editor: any,
  container: HTMLElement | null | undefined,
  origin: HTMLElement,
) => {
  const first = container ? getFocusableControls(container)[0] : undefined;
  if (!first) return false;
  setSettingsOrigin(editor, origin);
  first.focus();
  return true;
};

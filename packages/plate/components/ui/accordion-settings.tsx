import * as React from 'react';

import type { Path, TElement } from 'platejs';

import { GripVerticalIcon, PlusIcon } from 'lucide-react';
import { createPortal } from 'react-dom';
import {
  Button as AriaButton,
  DropIndicator,
  GridList,
  GridListItem,
  useDragAndDrop,
  type Key,
} from 'react-aria-components';
import {
  useEditorRef,
  useEditorSelection,
  useEditorSelector,
  usePluginOption,
} from 'platejs/react';

import { cn } from '../../lib/utils';
import { usePlateHost } from '../editor/plate-host-context';
import { AccordionEditorPlugin } from '../editor/plugins/accordion/accordion-editor-plugin';
import {
  getAnchorPlaceholder,
  isAnchorTaken,
  slugify,
} from '../editor/plugins/accordion/anchor';
import {
  duplicatePanel,
  findAccordionEntry,
  getSettingsEntry,
  insertAccordionPanel,
  movePanel,
  removePanel,
  reorderPanel,
  setPanelOpen,
  setSettingsTarget,
  type AccordionSettingsTarget,
} from '../editor/plugins/accordion/editor-transforms';
import { getAccordionOptions } from '../editor/plugins/accordion/options';
import {
  ACCORDION_KEY,
  ACCORDION_PANEL_KEY,
  type TAccordionElement,
  type TAccordionPanelElement,
} from '../editor/plugins/accordion/types';
import { useTranslation } from '../editor/plugins/i18n';
import { Button } from './button';
import { Input } from './input';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

/*
 * The settings of an accordion and of its panels. They render in the host's
 * settings container, such as a sidebar, when `PlateEditor` gets one, and in a
 * popover next to the accordion otherwise.
 */

const fieldClass = 'flex flex-col gap-1.5';
const labelClass = 'text-sm font-medium';
const hintClass = 'text-xs text-muted-foreground';
const groupClass = 'flex flex-col gap-3 border-t pt-4';

const blocksLabel = (
  count: number,
  t: ReturnType<typeof useTranslation>['t'],
) =>
  count === 1
    ? t('plate.accordion.oneBlock', { defaultValue: '1 block' })
    : t('plate.accordion.blocks', { defaultValue: '{{count}} blocks', count });

/** Selection › Accordion › Panel “…”: the levels above what the settings show. */
export function AccordionBreadcrumb({
  accordion,
  panel,
}: {
  accordion: TAccordionElement;
  panel?: { node: TAccordionPanelElement; title: string };
}) {
  const editor = useEditorRef();
  const { t } = useTranslation();
  const accordionLabel = t('plate.accordion.label', {
    defaultValue: 'Accordion',
  });

  return (
    <nav
      aria-label={t('plate.accordion.selection', { defaultValue: 'Selection' })}
    >
      <ol className="flex flex-wrap items-center gap-1 text-sm">
        <li>
          {panel ? (
            <button
              type="button"
              className={`
                rounded-sm px-1 py-0.5 text-primary underline-offset-2
                hover:underline
              `}
              onClick={() =>
                setSettingsTarget(editor, {
                  type: ACCORDION_KEY,
                  id: accordion.id,
                })
              }
            >
              {accordionLabel}
            </button>
          ) : (
            <span aria-current="true" className="px-1 font-semibold">
              {accordionLabel}
            </span>
          )}
        </li>
        {panel && (
          <>
            <li aria-hidden="true" className="text-muted-foreground">
              ›
            </li>
            <li>
              <span aria-current="true" className="px-1 font-semibold">
                {t('plate.accordion.panelCrumb', {
                  defaultValue: 'Panel “{{title}}”',
                  title:
                    panel.title ||
                    t('plate.accordion.untitled', {
                      defaultValue: 'Untitled',
                    }),
                })}
              </span>
            </li>
          </>
        )}
      </ol>
    </nav>
  );
}

function PanelOutline({
  accordion,
  accordionPath,
}: {
  accordion: TAccordionElement;
  accordionPath: Path;
}) {
  const editor = useEditorRef();
  const { t } = useTranslation();
  const panels = accordion.children as TAccordionPanelElement[];
  const indexOf = (key: Key) => panels.findIndex((panel) => panel.id === key);

  const { dragAndDropHooks } = useDragAndDrop({
    getItems: (keys) => [...keys].map((key) => ({ 'text/plain': String(key) })),
    onReorder: (event) => {
      const from = indexOf([...event.keys][0]);
      let to = indexOf(event.target.key);
      if (from < 0 || to < 0) return;
      if (event.target.dropPosition === 'after' && from > to) to += 1;
      if (event.target.dropPosition === 'before' && from < to) to -= 1;
      reorderPanel(editor, accordionPath, from, to);
    },
    renderDropIndicator: (target) => (
      <DropIndicator
        target={target}
        className={({ isDropTarget }) =>
          cn('h-0.5 rounded-full', isDropTarget && 'bg-primary')
        }
      />
    ),
  });

  return (
    <GridList
      aria-label={t('plate.accordion.panels', { defaultValue: 'Panels' })}
      className="flex flex-col gap-1"
      dragAndDropHooks={dragAndDropHooks}
      onAction={(key) => {
        const index = indexOf(key);
        if (index < 0) return;
        setPanelOpen(editor, [...accordionPath, index], true);
        setSettingsTarget(editor, {
          type: ACCORDION_PANEL_KEY,
          id: String(key),
        });
      }}
    >
      {panels.map((panel: TAccordionPanelElement, index: number) => {
        const title =
          (panel.children[0]?.children ?? [])
            .map((leaf) => leaf.text)
            .join('') ||
          t('plate.accordion.untitledPanel', {
            defaultValue: 'Untitled panel',
          });
        const meta = [
          blocksLabel(panel.children[1]?.children.length ?? 0, t),
          panel.startOpen
            ? t('plate.accordion.opensOnLoad', {
                defaultValue: 'opens on load',
              })
            : '',
        ]
          .filter(Boolean)
          .join(' · ');
        return (
          <GridListItem
            key={panel.id}
            id={panel.id}
            textValue={`${index + 1}. ${title}`}
            className={({ isFocusVisible, isDragging }) =>
              cn(
                `
                  flex min-h-10 cursor-pointer items-center gap-2 rounded-md border bg-background
                  pr-2 text-sm outline-none
                  hover:border-primary
                `,
                isFocusVisible && 'ring-2 ring-ring',
                isDragging && 'opacity-50',
              )
            }
          >
            <AriaButton
              slot="drag"
              className={`
                flex size-8 shrink-0 cursor-grab items-center justify-center rounded-md
                text-muted-foreground outline-none
                hover:bg-accent
                focus-visible:ring-2 focus-visible:ring-ring
              `}
              aria-label={t('plate.accordion.dragToReorder', {
                defaultValue: 'Drag to reorder',
              })}
            >
              <GripVerticalIcon aria-hidden="true" className="size-4" />
            </AriaButton>
            {/* The meta goes below the title: sidebars are narrow. */}
            <span className="flex min-w-0 flex-1 flex-col py-1.5">
              <span className="truncate">
                {index + 1}. {title}
              </span>
              {meta && (
                <small className="truncate text-xs text-muted-foreground">
                  {meta}
                </small>
              )}
            </span>
          </GridListItem>
        );
      })}
    </GridList>
  );
}

export function AccordionSettings({
  accordion,
  path,
}: {
  accordion: TAccordionElement;
  path: Path;
}) {
  const editor = useEditorRef();
  const { t } = useTranslation();
  const { themes } = getAccordionOptions(editor);
  const exclusiveId = React.useId();
  const exclusiveHintId = React.useId();
  const panelCount = accordion.children.length;

  return (
    <div className="flex flex-col gap-4">
      <AccordionBreadcrumb accordion={accordion} />
      <div>
        <h2 className="text-lg font-semibold">
          {t('plate.accordion.label', { defaultValue: 'Accordion' })}
        </h2>
        <p className={hintClass}>
          {panelCount === 1
            ? t('plate.accordion.onePanel', { defaultValue: '1 panel' })
            : t('plate.accordion.panelCount', {
                defaultValue: '{{count}} panels',
                count: panelCount,
              })}
        </p>
      </div>

      <div className={groupClass}>
        <span className={labelClass}>
          {t('plate.accordion.panels', { defaultValue: 'Panels' })}
        </span>
        <PanelOutline accordion={accordion} accordionPath={path} />
        <p className={hintClass}>
          {t('plate.accordion.outlineHint', {
            defaultValue:
              'Drag to reorder. Select a panel to open it and see its settings.',
          })}
        </p>
        <div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => insertAccordionPanel(editor, path, panelCount)}
          >
            <PlusIcon aria-hidden="true" />
            {t('plate.accordion.addPanel', { defaultValue: 'Add panel' })}
          </Button>
        </div>
      </div>

      <div className={groupClass}>
        <span className={labelClass}>
          {t('plate.accordion.behaviour', { defaultValue: 'Behaviour' })}
        </span>
        <div className="flex items-start gap-2">
          <input
            id={exclusiveId}
            type="checkbox"
            className="mt-0.5 size-4"
            checked={accordion.exclusive !== false}
            aria-describedby={exclusiveHintId}
            onChange={(event) =>
              editor.tf.setNodes(
                { exclusive: event.target.checked },
                { at: path },
              )
            }
          />
          <label htmlFor={exclusiveId} className="text-sm">
            {t('plate.accordion.exclusive', {
              defaultValue: 'Only one panel open at a time',
            })}
          </label>
        </div>
        <p id={exclusiveHintId} className={hintClass}>
          {t('plate.accordion.exclusiveHint', {
            defaultValue:
              'Applies to the published page. While editing, panels open and close independently so you can work on several at once.',
          })}
        </p>
      </div>

      <fieldset className={groupClass}>
        <legend className={cn(labelClass, 'float-left mb-3 w-full')}>
          {t('plate.accordion.background', { defaultValue: 'Background' })}
        </legend>
        <div className="flex flex-wrap gap-2">
          {themes.map((theme) => {
            const checked = accordion.theme === theme.id;
            return (
              <label
                key={theme.id}
                className={cn(
                  `
                    flex min-h-10 cursor-pointer items-center gap-2 rounded-md border bg-background
                    py-1.5 pr-3 pl-1.5 text-sm
                    has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring
                  `,
                  checked && 'border-primary ring-1 ring-primary',
                )}
              >
                <input
                  type="radio"
                  name={`accordion-${accordion.id}-background`}
                  value={theme.id}
                  checked={checked}
                  className="sr-only"
                  onChange={() =>
                    editor.tf.setNodes({ theme: theme.id }, { at: path })
                  }
                />
                <span
                  aria-hidden="true"
                  className="block size-6 rounded-full border"
                  style={{ background: theme.color }}
                />
                {t(`plate.accordion.themes.${theme.id}`, {
                  defaultValue: theme.label,
                })}
              </label>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}

/** Replaces the text of a panel title. */
const setPanelTitle = (editor: any, panelPath: Path, text: string) => {
  const titlePath = [...panelPath, 0];
  editor.tf.withoutNormalizing(() => {
    editor.tf.delete({ at: editor.api.range(titlePath) });
    editor.tf.insertText(text, { at: editor.api.start(titlePath) });
  });
};

export function PanelSettings({
  panel,
  path,
}: {
  panel: TAccordionPanelElement;
  path: Path;
}) {
  const editor = useEditorRef();
  const { t } = useTranslation();
  const titleId = React.useId();
  const startOpenId = React.useId();
  const anchorId = React.useId();
  const anchorHintId = React.useId();
  const anchorErrorId = React.useId();

  const accordionPath = path.slice(0, -1);
  const accordion = editor.api.node(accordionPath)?.[0] as
    TAccordionElement | undefined;
  const index = path.at(-1) ?? 0;
  const total = accordion?.children.length ?? 1;
  const title = editor.api.string([...path, 0]);
  const blockCount = panel.children[1]?.children.length ?? 0;
  const placeholder = getAnchorPlaceholder(title, index);

  // The anchor is typed freely and becomes a slug when the field loses focus.
  const [anchorDraft, setAnchorDraft] = React.useState(panel.anchor ?? '');
  React.useEffect(() => setAnchorDraft(panel.anchor ?? ''), [panel.anchor]);
  const anchorTaken = isAnchorTaken(editor, panel.id, panel.anchor ?? '');

  if (!accordion) return null;

  return (
    <div className="flex flex-col gap-4">
      <AccordionBreadcrumb
        accordion={accordion}
        panel={{ node: panel, title }}
      />
      <div>
        <h2 className="text-lg font-semibold">
          {t('plate.accordion.panel', { defaultValue: 'Panel' })}
        </h2>
        <p className={hintClass}>
          {t('plate.accordion.panelPosition', {
            defaultValue: 'Panel {{position}} of {{total}} · {{blocks}}',
            position: index + 1,
            total,
            blocks: blocksLabel(blockCount, t),
          })}
        </p>
      </div>

      <div className={fieldClass}>
        <label htmlFor={titleId} className={labelClass}>
          {t('plate.accordion.title', { defaultValue: 'Title' })}
        </label>
        <Input
          id={titleId}
          value={title}
          placeholder={t('plate.accordion.untitledPanel', {
            defaultValue: 'Untitled panel',
          })}
          onChange={(event) => setPanelTitle(editor, path, event.target.value)}
        />
      </div>

      <div className="flex items-start gap-2">
        <input
          id={startOpenId}
          type="checkbox"
          className="mt-0.5 size-4"
          checked={!!panel.startOpen}
          onChange={(event) =>
            editor.tf.setNodes(
              { startOpen: event.target.checked },
              { at: path },
            )
          }
        />
        <label htmlFor={startOpenId} className="text-sm">
          {t('plate.accordion.startOpen', {
            defaultValue: 'Open when the page loads',
          })}
        </label>
      </div>

      <div className={fieldClass}>
        <label htmlFor={anchorId} className={labelClass}>
          {t('plate.accordion.anchor', { defaultValue: 'Link anchor' })}
        </label>
        <Input
          id={anchorId}
          value={anchorDraft}
          placeholder={placeholder}
          aria-invalid={anchorTaken || undefined}
          aria-describedby={cn(anchorHintId, anchorTaken && anchorErrorId)}
          onChange={(event) => setAnchorDraft(event.target.value)}
          onBlur={() => {
            const anchor = slugify(anchorDraft);
            setAnchorDraft(anchor);
            if (anchor !== panel.anchor) {
              editor.tf.setNodes({ anchor }, { at: path });
            }
          }}
        />
        <p id={anchorHintId} className={hintClass}>
          {t('plate.accordion.anchorHint', {
            defaultValue:
              'Links to #{{anchor}} open this panel and scroll to it.',
            anchor: panel.anchor || placeholder,
          })}
        </p>
        {anchorTaken && (
          <p
            id={anchorErrorId}
            role="alert"
            className="text-xs text-destructive"
          >
            {t('plate.accordion.anchorTaken', {
              defaultValue:
                'Another panel already uses this anchor. Choose another one.',
            })}
          </p>
        )}
      </div>

      <div className={groupClass}>
        <span className={labelClass}>
          {t('plate.accordion.panelActions', {
            defaultValue: 'Panel actions',
          })}
        </span>
        <div className="flex flex-wrap gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={index === 0}
            onClick={() => movePanel(editor, path, -1)}
          >
            {t('plate.accordion.moveUp', { defaultValue: 'Move up' })}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={index === total - 1}
            onClick={() => movePanel(editor, path, 1)}
          >
            {t('plate.accordion.moveDown', { defaultValue: 'Move down' })}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => duplicatePanel(editor, path)}
          >
            {t('plate.accordion.duplicate', { defaultValue: 'Duplicate' })}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-destructive"
            disabled={total < 2}
            onClick={() => {
              if (removePanel(editor, path)) {
                setSettingsTarget(editor, {
                  type: ACCORDION_KEY,
                  id: accordion.id,
                });
              }
            }}
          >
            {t('plate.accordion.delete', { defaultValue: 'Delete' })}
          </Button>
        </div>
      </div>
    </div>
  );
}

/** The settings of an accordion or a panel, for its node. */
export function AccordionSettingsForm({
  node,
  path,
}: {
  node: TElement;
  path: Path;
}) {
  if (node.type === ACCORDION_KEY) {
    return (
      <AccordionSettings accordion={node as TAccordionElement} path={path} />
    );
  }
  if (node.type === ACCORDION_PANEL_KEY) {
    return <PanelSettings panel={node as TAccordionPanelElement} path={path} />;
  }
  return null;
}

/**
 * Renders the settings of the chosen accordion or panel in the host's
 * settings container. Without one, they open in popovers instead.
 */
export function AccordionSettingsHost() {
  const { settingsContainer } = usePlateHost();
  // The chosen target lives in the plugin options, outside the editor value.
  const target = usePluginOption(AccordionEditorPlugin, 'settingsTarget');
  // A panel's settings show while the caret is in its title.
  const selection = useEditorSelection();
  const entry = useEditorSelector(
    (editor) => getSettingsEntry(editor),
    [target, selection],
  );

  if (!settingsContainer || !entry) return null;
  const container = settingsContainer();
  if (!container) return null;

  return createPortal(
    <div className="p-4" data-accordion-settings="">
      <AccordionSettingsForm node={entry[0]} path={entry[1]} />
    </div>,
    container,
  );
}

/**
 * Opens the settings of an accordion or a panel: in the host's settings
 * container when there is one, in a popover otherwise.
 */
export function AccordionSettingsTrigger({
  target,
  label,
  children,
  className,
  variant = 'ghost',
  size = 'icon',
}: {
  target: AccordionSettingsTarget;
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
    (ed) => (open ? findAccordionEntry(ed, target) : undefined),
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
        {entry && <AccordionSettingsForm node={entry[0]} path={entry[1]} />}
      </PopoverContent>
    </Popover>
  );
}

/**
 * The accordion or panel whose settings the user chose to see, if any. A
 * host hides a block's own settings meanwhile, since the accordion's take
 * their place.
 */
export const useAccordionSettingsTarget = () =>
  usePluginOption(AccordionEditorPlugin, 'settingsTarget');

/**
 * For a block inside an accordion panel: the levels above it (Accordion ›
 * Panel “…” › the block), its position in the panel, and an optional note.
 * A host renders it above the block's settings. It renders nothing for
 * blocks outside an accordion.
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
  const accordionPath = path.slice(0, -3);
  const panelPath = path.slice(0, -2);
  const accordion = (
    accordionPath.length > 0 ? editor.api.node(accordionPath)?.[0] : undefined
  ) as TAccordionElement | undefined;
  const panel = (
    panelPath.length > 0 ? editor.api.node(panelPath)?.[0] : undefined
  ) as TAccordionPanelElement | undefined;
  if (
    accordion?.type !== ACCORDION_KEY ||
    panel?.type !== ACCORDION_PANEL_KEY
  ) {
    return null;
  }

  const title = editor.api.string([...panelPath, 0]);
  const titleOrUntitled =
    title ||
    t('plate.accordion.untitledPanel', { defaultValue: 'Untitled panel' });
  const index = path.at(-1) ?? 0;
  const total = panel.children[1]?.children.length ?? 0;
  const crumbClass =
    'rounded-sm px-1 py-0.5 text-primary underline-offset-2 hover:underline';

  return (
    <div className="mb-4 flex flex-col gap-2" data-accordion-block-header="">
      <nav
        aria-label={t('plate.accordion.selection', {
          defaultValue: 'Selection',
        })}
      >
        <ol className="flex flex-wrap items-center gap-1 text-sm">
          <li>
            <button
              type="button"
              className={crumbClass}
              onClick={() =>
                setSettingsTarget(editor, {
                  type: ACCORDION_KEY,
                  id: accordion.id,
                })
              }
            >
              {t('plate.accordion.label', { defaultValue: 'Accordion' })}
            </button>
          </li>
          <li aria-hidden="true" className="text-muted-foreground">
            ›
          </li>
          <li>
            <button
              type="button"
              className={crumbClass}
              onClick={() =>
                setSettingsTarget(editor, {
                  type: ACCORDION_PANEL_KEY,
                  id: panel.id,
                })
              }
            >
              {t('plate.accordion.panelCrumb', {
                defaultValue: 'Panel “{{title}}”',
                title:
                  title ||
                  t('plate.accordion.untitled', { defaultValue: 'Untitled' }),
              })}
            </button>
          </li>
          <li aria-hidden="true" className="text-muted-foreground">
            ›
          </li>
          <li>
            <span aria-current="true" className="px-1 font-semibold">
              {blockLabel}
            </span>
          </li>
        </ol>
      </nav>
      <p className={hintClass}>
        {t('plate.accordion.blockPosition', {
          defaultValue: 'Block {{position}} of {{total}} in “{{title}}”',
          position: index + 1,
          total,
          title: titleOrUntitled,
        })}
      </p>
      {note && <p className="text-sm text-muted-foreground">{note}</p>}
    </div>
  );
}

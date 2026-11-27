import * as React from 'react';

import type { Path } from 'platejs';
import type { PlateElementProps } from 'platejs/react';

import { ChevronDownIcon, PlusIcon } from 'lucide-react';
import { PathApi } from 'platejs';
import {
  PlateElement,
  useEditorRef,
  useEditorSelector,
  usePluginOption,
  useReadOnly,
} from 'platejs/react';

import { cn } from '../../lib/utils';
import { AccordionEditorPlugin } from '../editor/plugins/accordion/accordion-editor-plugin';
import {
  insertAccordionPanel,
  setAllPanelsOpen,
  setPanelOpen,
} from '../editor/plugins/accordion/editor-transforms';
import {
  getAccordionOptions,
  resolveAccordionTheme,
} from '../editor/plugins/accordion/options';
import type {
  TAccordionElement,
  TAccordionPanelElement,
} from '../editor/plugins/accordion/types';
import { useTranslation } from '../editor/plugins/i18n';
import { BlockInnerContainer } from './block-inner-container';
import { Button } from './button';

/*
 * The accordion in the editor. While editing, every panel opens and closes on
 * its own, and the controls to add panels show while the selection is in the
 * accordion.
 */

/** Whether the selection is inside the node at `path`. */
const useSelectionInside = (path: Path) => {
  const key = path.join('.');
  return useEditorSelector(
    (editor) => {
      const selection = editor.selection;
      return (
        !!selection &&
        PathApi.isAncestor(path, selection.anchor.path) &&
        PathApi.isAncestor(path, selection.focus.path)
      );
    },
    // `key` stands for `path`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key],
  );
};

const usePanelOpen = (panelId: string) => {
  const closedPanels = usePluginOption(AccordionEditorPlugin, 'closedPanels');
  return !closedPanels?.[panelId];
};

const keepSelection = (event: React.MouseEvent) => {
  // The buttons act on the editor without moving its selection.
  event.preventDefault();
};

function InsertPanelButton({
  accordionPath,
  index,
  label,
  className,
}: {
  accordionPath: Path;
  index: number;
  label: string;
  className?: string;
}) {
  const { t } = useTranslation();
  const editor = useEditorRef();

  return (
    <div
      contentEditable={false}
      className={cn(
        `
          group/insert relative flex h-6 items-center justify-center select-none
          before:absolute before:inset-x-0 before:top-1/2 before:border-t-2 before:border-primary
          before:opacity-0 before:transition-opacity
          hover:before:opacity-40
          has-[button:focus-visible]:before:opacity-100 has-[button:hover]:before:opacity-100
        `,
        className,
      )}
    >
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="relative z-10 h-6 rounded-full px-2.5 text-xs"
        aria-label={label}
        onMouseDown={keepSelection}
        onClick={() => insertAccordionPanel(editor, accordionPath, index)}
      >
        <PlusIcon aria-hidden="true" />
        {t('plate.accordion.panel', { defaultValue: 'Panel' })}
      </Button>
    </div>
  );
}

export function AccordionElement(props: PlateElementProps<TAccordionElement>) {
  const { children, editor, element, path } = props;
  const { t } = useTranslation();
  const readOnly = useReadOnly();
  const active = useSelectionInside(path);
  const { themes } = getAccordionOptions(editor);
  const theme = resolveAccordionTheme(themes, element.theme);

  return (
    <PlateElement
      {...props}
      attributes={{
        ...props.attributes,
        'data-exclusive': element.exclusive === false ? 'false' : 'true',
        'data-theme': theme.id,
        ...(active ? { 'data-active': 'true' } : {}),
      }}
      style={
        {
          ...props.style,
          '--block-accordion-background': theme.color,
          '--theme-color': theme.color,
        } as React.CSSProperties
      }
    >
      <BlockInnerContainer
        className={cn(
          !readOnly &&
            `
              outline-1 outline-transparent
              hover:outline-primary/30
            `,
          !readOnly && active && 'outline-primary/60 outline-dashed',
        )}
      >
        {!readOnly && (
          <div
            contentEditable={false}
            className="flex min-h-8 items-center justify-between gap-2 select-none"
          >
            <span
              className={`
                inline-flex items-center rounded-full border border-border bg-background px-3 py-0.5
                text-xs text-muted-foreground
              `}
            >
              {t('plate.accordion.label', { defaultValue: 'Accordion' })}
            </span>
            {active && (
              <div className="flex gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 rounded-full text-xs"
                  onMouseDown={keepSelection}
                  onClick={() => setAllPanelsOpen(editor, path, true)}
                >
                  {t('plate.accordion.expandAll', {
                    defaultValue: 'Expand all',
                  })}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 rounded-full text-xs"
                  onMouseDown={keepSelection}
                  onClick={() => setAllPanelsOpen(editor, path, false)}
                >
                  {t('plate.accordion.collapseAll', {
                    defaultValue: 'Collapse all',
                  })}
                </Button>
              </div>
            )}
          </div>
        )}
        {children}
        {!readOnly && active && (
          <InsertPanelButton
            accordionPath={path}
            index={element.children.length}
            className="h-10"
            label={t('plate.accordion.addPanelAtEnd', {
              defaultValue: 'Add a panel at the end',
            })}
          />
        )}
      </BlockInnerContainer>
    </PlateElement>
  );
}

export function AccordionPanelElement(
  props: PlateElementProps<TAccordionPanelElement>,
) {
  const { children, element, path } = props;
  const { t } = useTranslation();
  const readOnly = useReadOnly();
  const open = usePanelOpen(element.id);
  const accordionPath = PathApi.parent(path);
  const accordionActive = useSelectionInside(accordionPath);
  const index = path.at(-1) ?? 0;
  const isLast = useEditorSelector(
    (editor) => {
      const accordion = editor.api.node(accordionPath)?.[0] as
        { children?: unknown[] } | undefined;
      return index === (accordion?.children?.length ?? 0) - 1;
    },
    // `accordionPath` is derived from `path`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [path.join('.')],
  );

  return (
    <PlateElement
      {...props}
      className={cn(props.className, 'block-accordion__panel')}
      attributes={{
        ...props.attributes,
        'data-open': open ? 'true' : 'false',
      }}
    >
      {children}
      {!readOnly && accordionActive && !isLast && (
        <InsertPanelButton
          accordionPath={accordionPath}
          index={index + 1}
          label={t('plate.accordion.insertPanelBetween', {
            defaultValue:
              'Insert a panel between panel {{before}} and {{after}}',
            before: index + 1,
            after: index + 2,
          })}
        />
      )}
    </PlateElement>
  );
}

export function AccordionPanelTitleElement(props: PlateElementProps) {
  const { children, editor, path } = props;
  const { t } = useTranslation();
  const readOnly = useReadOnly();
  const panelPath = PathApi.parent(path);
  const panel = editor.api.node(panelPath)?.[0] as
    TAccordionPanelElement | undefined;
  const panelId = panel?.id ?? '';
  const open = usePanelOpen(panelId);
  const { headingLevel } = getAccordionOptions(editor);

  const text = editor.api.string(path);
  const blockCount = panel?.children[1]?.children.length ?? 0;
  const titleOrUntitled =
    text ||
    t('plate.accordion.untitledPanelLower', {
      defaultValue: 'untitled panel',
    });

  return (
    <PlateElement
      {...props}
      as={`h${headingLevel}`}
      className={cn(
        props.className,
        'block-accordion__heading flex items-center gap-2',
      )}
    >
      <span className="block-accordion__title relative min-w-0 flex-1 py-2">
        {children}
        {!text && !readOnly && (
          <span
            contentEditable={false}
            aria-hidden="true"
            className={`
              pointer-events-none absolute inset-y-2 left-0 font-medium text-muted-foreground
              select-none
            `}
          >
            {t('plate.accordion.untitledPanel', {
              defaultValue: 'Untitled panel',
            })}
          </span>
        )}
      </span>
      {!open && (
        <span
          contentEditable={false}
          className="text-sm font-normal whitespace-nowrap text-muted-foreground select-none"
        >
          {blockCount === 1
            ? t('plate.accordion.oneBlock', { defaultValue: '1 block' })
            : t('plate.accordion.blocks', {
                defaultValue: '{{count}} blocks',
                count: blockCount,
              })}
        </span>
      )}
      {!readOnly && panel && (
        <Button
          contentEditable={false}
          type="button"
          variant="ghost"
          size="icon"
          className="size-10 shrink-0"
          aria-expanded={open}
          aria-controls={`accordion-editor-${panelId}-content`}
          aria-label={
            open
              ? t('plate.accordion.collapsePanel', {
                  defaultValue: 'Collapse {{title}}',
                  title: titleOrUntitled,
                })
              : t('plate.accordion.expandPanel', {
                  defaultValue: 'Expand {{title}}',
                  title: titleOrUntitled,
                })
          }
          onMouseDown={keepSelection}
          onClick={() => setPanelOpen(editor, panelPath, !open)}
        >
          <ChevronDownIcon
            aria-hidden="true"
            className={cn(
              `
                size-5 transition-transform
                motion-reduce:transition-none
              `,
              open && 'rotate-180',
            )}
          />
        </Button>
      )}
    </PlateElement>
  );
}

export function AccordionPanelContentElement(props: PlateElementProps) {
  const { editor, path } = props;
  const panelPath = PathApi.parent(path);
  const panel = editor.api.node(panelPath)?.[0] as
    TAccordionPanelElement | undefined;
  const panelId = panel?.id ?? '';
  const open = usePanelOpen(panelId);

  return (
    <PlateElement
      {...props}
      className={cn(props.className, 'block-accordion__content')}
      attributes={{
        ...props.attributes,
        id: `accordion-editor-${panelId}-content`,
        ...(open ? {} : { hidden: true }),
      }}
    >
      {props.children}
    </PlateElement>
  );
}

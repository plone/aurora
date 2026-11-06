import * as React from 'react';

import type { RenderNodeWrapper, PlateElementProps } from 'platejs/react';

import {
  ArrowDownIcon,
  ArrowUpIcon,
  MoreHorizontalIcon,
  PlusIcon,
} from 'lucide-react';
import { ElementApi, PathApi, type Path, type TElement } from 'platejs';
import {
  useEditorRef,
  useEditorSelector,
  usePluginOption,
} from 'platejs/react';

import { cn } from '../../lib/utils';
import { AccordionEditorPlugin } from '../editor/plugins/accordion/accordion-editor-plugin';
import { findAccordionNodePath } from '../editor/plugins/accordion/find-path';
import {
  duplicateInnerBlock,
  getInnerBlockLabel,
  getTurnIntoOptions,
  insertInnerBlockAt,
  moveInnerBlock,
  removeInnerBlock,
  turnIntoInnerBlock,
} from '../editor/plugins/accordion/inner-block-transforms';
import { ACCORDION_PANEL_CONTENT_KEY } from '../editor/plugins/accordion/types';
import { useTranslation } from '../editor/plugins/i18n';
import { Button } from './button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from './dropdown-menu';

/*
 * The blocks of an accordion panel get a toolbar (Move up, Move down and a
 * "Block actions" menu) and an insert point before them. The toolbars are
 * faded unless their block holds the selection, and hide while the user
 * types, until the mouse moves.
 */

const keepSelection = (event: React.MouseEvent) => {
  // The buttons act on the editor without moving its selection.
  event.preventDefault();
};

/** The position of a block of a panel, read from the editor's value. */
const useInnerBlockPosition = (element: TElement) => {
  const position = useEditorSelector(
    (editor) => {
      const path = findAccordionNodePath(editor, element);
      if (!path) return '';
      const content = editor.api.node(PathApi.parent(path))?.[0] as
        TElement | undefined;
      const selection = editor.selection;
      const selected =
        !!selection &&
        PathApi.isAncestor(path, selection.anchor.path) &&
        PathApi.isAncestor(path, selection.focus.path);
      const accordionPath = path.slice(0, -3);
      const accordionActive =
        !!selection && PathApi.isAncestor(accordionPath, selection.anchor.path);
      return [
        path.join('.'),
        content?.children.length ?? 0,
        selected ? 1 : 0,
        accordionActive ? 1 : 0,
      ].join(':');
    },
    [element],
  );
  const [pathKey, total, selected, accordionActive] = position.split(':');
  const blockPath: Path = pathKey ? pathKey.split('.').map(Number) : [];
  return {
    blockPath,
    contentPath: blockPath.slice(0, -1),
    index: blockPath.at(-1) ?? 0,
    total: Number(total) || 0,
    selected: selected === '1',
    accordionActive: accordionActive === '1',
  };
};

export function InsertBlockPoint({
  contentPath,
  index,
  label,
  visible,
  className,
}: {
  contentPath: Path;
  index: number;
  label: string;
  visible: boolean;
  className?: string;
}) {
  const editor = useEditorRef();
  const { t } = useTranslation();
  if (!visible) return null;

  return (
    <div
      contentEditable={false}
      className={cn(
        `
          group/insert-block relative flex h-3.5 items-center justify-center select-none
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
        className={`
          relative z-10 h-6 rounded-full px-2.5 text-xs opacity-0 transition-opacity
          group-hover/insert-block:opacity-100
          focus-visible:opacity-100
        `}
        aria-label={label}
        onMouseDown={keepSelection}
        onClick={() => insertInnerBlockAt(editor, contentPath, index)}
      >
        <PlusIcon aria-hidden="true" />
        {t('plate.accordion.block', { defaultValue: 'Block' })}
      </Button>
    </div>
  );
}

function BlockActionsMenu({
  blockPath,
  element,
  index,
  total,
}: {
  blockPath: Path;
  element: TElement;
  index: number;
  total: number;
}) {
  const editor = useEditorRef();
  const { t } = useTranslation();
  const turnIntoOptions = getTurnIntoOptions(editor, element);

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8"
          aria-label={t('plate.accordion.blockActions', {
            defaultValue: 'Block actions',
          })}
          title={t('plate.accordion.blockActions', {
            defaultValue: 'Block actions',
          })}
          onMouseDown={keepSelection}
        >
          <MoreHorizontalIcon aria-hidden="true" className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44">
        <DropdownMenuItem
          disabled={index === 0}
          onSelect={() => moveInnerBlock(editor, blockPath, -1)}
        >
          {t('plate.accordion.moveUp', { defaultValue: 'Move up' })}
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={index === total - 1}
          onSelect={() => moveInnerBlock(editor, blockPath, 1)}
        >
          {t('plate.accordion.moveDown', { defaultValue: 'Move down' })}
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => duplicateInnerBlock(editor, blockPath)}
        >
          {t('plate.accordion.duplicate', { defaultValue: 'Duplicate' })}
        </DropdownMenuItem>
        {turnIntoOptions.length > 0 && (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              {t('plate.accordion.turnInto', { defaultValue: 'Turn into…' })}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {turnIntoOptions.map((id) => (
                <DropdownMenuItem
                  key={id}
                  onSelect={() => turnIntoInnerBlock(editor, blockPath, id)}
                >
                  {getInnerBlockLabel(id, t)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onSelect={() => removeInnerBlock(editor, blockPath)}
        >
          {t('plate.accordion.delete', { defaultValue: 'Delete' })}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function InnerBlock(props: PlateElementProps) {
  const { children, element } = props;
  const editor = useEditorRef();
  const { t } = useTranslation();
  const typing = usePluginOption(AccordionEditorPlugin, 'typing');
  const { accordionActive, blockPath, contentPath, index, selected, total } =
    useInnerBlockPosition(element);

  if (blockPath.length === 0) return <>{children}</>;

  // The panel's title names the insert points: several panels can be open.
  const titlePath = [...blockPath.slice(0, -2), 0];
  const panelTitle =
    (editor.api.node(titlePath) && editor.api.string(titlePath)) ||
    t('plate.accordion.untitledPanel', { defaultValue: 'Untitled panel' });

  return (
    <div
      className="group/block relative"
      data-accordion-block=""
      {...(selected ? { 'data-selected': 'true' } : {})}
    >
      <InsertBlockPoint
        contentPath={contentPath}
        index={index}
        visible={accordionActive}
        label={
          index === 0
            ? t('plate.accordion.insertBlockAtTop', {
                defaultValue: 'Insert a block at the top of “{{title}}”',
                title: panelTitle,
              })
            : t('plate.accordion.insertBlockBetween', {
                defaultValue:
                  'Insert a block between block {{before}} and {{after}} of “{{title}}”',
                before: index,
                after: index + 1,
                title: panelTitle,
              })
        }
      />
      <div className="relative">
        {accordionActive && (
          <div
            contentEditable={false}
            className={cn(
              `
                absolute -top-4 right-2 z-20 flex items-center rounded-md border bg-background
                text-muted-foreground shadow-xs transition-opacity select-none
              `,
              selected
                ? 'border-border text-foreground opacity-100'
                : `
                  border-transparent opacity-40
                  group-hover/block:opacity-100
                  focus-within:opacity-100
                `,
              typing && 'invisible',
            )}
          >
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8"
              aria-label={t('plate.accordion.moveBlockUp', {
                defaultValue: 'Move block up',
              })}
              title={t('plate.accordion.moveBlockUp', {
                defaultValue: 'Move block up',
              })}
              disabled={index === 0}
              onMouseDown={keepSelection}
              onClick={() => moveInnerBlock(editor, blockPath, -1)}
            >
              <ArrowUpIcon aria-hidden="true" className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8"
              aria-label={t('plate.accordion.moveBlockDown', {
                defaultValue: 'Move block down',
              })}
              title={t('plate.accordion.moveBlockDown', {
                defaultValue: 'Move block down',
              })}
              disabled={index === total - 1}
              onMouseDown={keepSelection}
              onClick={() => moveInnerBlock(editor, blockPath, 1)}
            >
              <ArrowDownIcon aria-hidden="true" className="size-4" />
            </Button>
            <BlockActionsMenu
              blockPath={blockPath}
              element={element}
              index={index}
              total={total}
            />
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

/** Wraps the blocks of an accordion panel with their toolbar. */
export const AccordionInnerBlockWrapper: RenderNodeWrapper = ({
  editor,
  path,
}) => {
  if (editor.dom?.readOnly || !path || path.length < 2) return;
  const parent = editor.api.node(PathApi.parent(path))?.[0];
  if (
    !ElementApi.isElement(parent) ||
    parent.type !== ACCORDION_PANEL_CONTENT_KEY
  ) {
    return;
  }

  // eslint-disable-next-line react/display-name
  return (props) => <InnerBlock {...props} />;
};

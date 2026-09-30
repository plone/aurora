import * as React from 'react';

import { AIChatPlugin } from '@platejs/ai/react';
import {
  BLOCK_CONTEXT_MENU_ID,
  BlockMenuPlugin,
  BlockSelectionPlugin,
  copySelectedBlocks,
  pasteSelectedBlocks,
} from '@platejs/selection/react';
import { KEYS, type SlateEditor } from 'platejs';
import { useEditorPlugin, usePlateState, usePluginOption } from 'platejs/react';

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from './context-menu';
import { useIsTouchDevice } from '../../hooks/use-is-touch-device';

type Value = 'askAI' | null;

const SLATE_FRAGMENT = 'application/x-slate-fragment';

/**
 * The last blocks copied or cut from this menu. The async Clipboard API can't
 * read back the Slate fragment written to the system clipboard, so Paste uses
 * this copy while the clipboard still holds the same text, keeping Plone
 * blocks and every node attribute intact.
 */
let copiedBlocks: { text: string; fragment: string } | null = null;

/** Copies the selected blocks to the system clipboard and to `copiedBlocks`. */
function copyBlocks(editor: SlateEditor) {
  const data = new DataTransfer();
  if (!copySelectedBlocks(editor, data)) return false;

  copiedBlocks = {
    text: data.getData('text/plain'),
    fragment: data.getData(SLATE_FRAGMENT),
  };
  copySelectedBlocks(editor);
  return true;
}

/** Pastes the clipboard contents after the selected blocks. */
async function pasteBlocks(editor: SlateEditor) {
  const data = new DataTransfer();

  try {
    for (const item of await navigator.clipboard.read()) {
      for (const type of ['text/html', 'text/plain']) {
        if (item.types.includes(type)) {
          data.setData(type, await (await item.getType(type)).text());
        }
      }
    }
  } catch {
    // Clipboard access denied or unsupported: fall back to `copiedBlocks`.
  }

  const text = data.getData('text/plain');
  if (copiedBlocks && (!text || text.trim() === copiedBlocks.text.trim())) {
    data.setData(SLATE_FRAGMENT, copiedBlocks.fragment);
    if (!text) data.setData('text/plain', copiedBlocks.text);
  }

  if (!data.types.length) return;
  pasteSelectedBlocks(editor, { clipboardData: data } as ClipboardEvent);
}

export function BlockContextMenu({ children }: { children: React.ReactNode }) {
  const { api, editor } = useEditorPlugin(BlockMenuPlugin);
  const [value, setValue] = React.useState<Value>(null);
  const isTouch = useIsTouchDevice();
  const [readOnly] = usePlateState('readOnly');
  const openId = usePluginOption(BlockMenuPlugin, 'openId');
  const isOpen = openId === BLOCK_CONTEXT_MENU_ID;
  // Only offered when the AI chat plugin is part of the editor preset.
  const hasAI = !!editor.plugins[AIChatPlugin.key];

  const handleTurnInto = React.useCallback(
    (type: string) => {
      editor
        .getApi(BlockSelectionPlugin)
        .blockSelection.getNodes()
        .forEach(([node, path]) => {
          if (node[KEYS.listType]) {
            editor.tf.unsetNodes([KEYS.listType, 'indent'], {
              at: path,
            });
          }

          editor.tf.toggleBlock(type, { at: path });
        });
    },
    [editor],
  );

  const handleAlign = React.useCallback(
    (align: 'center' | 'left' | 'right') => {
      editor
        .getTransforms(BlockSelectionPlugin)
        .blockSelection.setNodes({ align });
    },
    [editor],
  );

  if (isTouch) {
    return children;
  }

  return (
    <ContextMenu
      onOpenChange={(open) => {
        if (!open) {
          api.blockMenu.hide();
        }
      }}
      modal={false}
    >
      <ContextMenuTrigger
        asChild
        onContextMenu={(event) => {
          const dataset = (event.target as HTMLElement).dataset;
          const disabled =
            dataset?.slateEditor === 'true' ||
            readOnly ||
            dataset?.plateOpenContextMenu === 'false';

          if (disabled) return event.preventDefault();

          setTimeout(() => {
            api.blockMenu.show(BLOCK_CONTEXT_MENU_ID, {
              x: event.clientX,
              y: event.clientY,
            });
          }, 0);
        }}
      >
        <div className="w-full">{children}</div>
      </ContextMenuTrigger>
      {isOpen && (
        <ContextMenuContent
          className="w-64"
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            editor.getApi(BlockSelectionPlugin).blockSelection.focus();

            if (value === 'askAI') {
              editor.getApi(AIChatPlugin).aiChat.show();
            }

            setValue(null);
          }}
        >
          {hasAI && (
            <ContextMenuGroup>
              <ContextMenuItem
                onClick={() => {
                  setValue('askAI');
                }}
              >
                Ask AI
              </ContextMenuItem>
            </ContextMenuGroup>
          )}

          <ContextMenuGroup>
            <ContextMenuItem
              onClick={() => {
                if (!copyBlocks(editor)) return;
                editor
                  .getTransforms(BlockSelectionPlugin)
                  .blockSelection.removeNodes();
                editor.tf.focus();
              }}
            >
              Cut
            </ContextMenuItem>
            <ContextMenuItem onClick={() => copyBlocks(editor)}>
              Copy
            </ContextMenuItem>
            <ContextMenuItem onClick={() => void pasteBlocks(editor)}>
              Paste
            </ContextMenuItem>
          </ContextMenuGroup>

          <ContextMenuGroup>
            <ContextMenuItem
              onClick={() => {
                editor
                  .getTransforms(BlockSelectionPlugin)
                  .blockSelection.duplicate();
              }}
            >
              Duplicate
              {/* <ContextMenuShortcut>⌘ + D</ContextMenuShortcut> */}
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => {
                editor
                  .getTransforms(BlockSelectionPlugin)
                  .blockSelection.removeNodes();
                editor.tf.focus();
              }}
            >
              Delete
            </ContextMenuItem>
            <ContextMenuSub>
              <ContextMenuSubTrigger>Turn into</ContextMenuSubTrigger>
              <ContextMenuSubContent className="w-48">
                <ContextMenuItem onClick={() => handleTurnInto(KEYS.p)}>
                  Paragraph
                </ContextMenuItem>

                <ContextMenuItem onClick={() => handleTurnInto(KEYS.h2)}>
                  Heading 2
                </ContextMenuItem>
                <ContextMenuItem onClick={() => handleTurnInto(KEYS.h3)}>
                  Heading 3
                </ContextMenuItem>
                <ContextMenuItem onClick={() => handleTurnInto(KEYS.h4)}>
                  Heading 4
                </ContextMenuItem>
                <ContextMenuItem onClick={() => handleTurnInto(KEYS.h5)}>
                  Heading 5
                </ContextMenuItem>
                <ContextMenuItem onClick={() => handleTurnInto(KEYS.h6)}>
                  Heading 6
                </ContextMenuItem>
                <ContextMenuItem
                  onClick={() => handleTurnInto(KEYS.blockquote)}
                >
                  Blockquote
                </ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>
          </ContextMenuGroup>

          <ContextMenuGroup>
            <ContextMenuItem
              onClick={() =>
                editor
                  .getTransforms(BlockSelectionPlugin)
                  .blockSelection.setIndent(1)
              }
            >
              Indent
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() =>
                editor
                  .getTransforms(BlockSelectionPlugin)
                  .blockSelection.setIndent(-1)
              }
            >
              Outdent
            </ContextMenuItem>
            <ContextMenuSub>
              <ContextMenuSubTrigger>Align</ContextMenuSubTrigger>
              <ContextMenuSubContent className="w-48">
                <ContextMenuItem onClick={() => handleAlign('left')}>
                  Left
                </ContextMenuItem>
                <ContextMenuItem onClick={() => handleAlign('center')}>
                  Center
                </ContextMenuItem>
                <ContextMenuItem onClick={() => handleAlign('right')}>
                  Right
                </ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>
          </ContextMenuGroup>
        </ContextMenuContent>
      )}
    </ContextMenu>
  );
}

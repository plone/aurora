import * as React from 'react';

import type { PlateEditor } from 'platejs/react';

import { AIChatPlugin } from '@platejs/ai/react';
import { PLONE_BLOCK_TYPE } from '@plone/helpers';
import config from '@plone/registry';
import {
  BookA,
  ChevronRightIcon,
  Code2,
  Columns3Icon,
  Heading2Icon,
  Heading3Icon,
  Heading4Icon,
  Heading5Icon,
  Heading6Icon,
  LightbulbIcon,
  ListIcon,
  ListOrdered,
  PilcrowIcon,
  Quote,
  SparklesIcon,
  Square,
  Table,
  TableOfContentsIcon,
} from 'lucide-react';
import { KEYS, PathApi } from 'platejs';

import { insertBlock } from '../transforms';
import { fallbackTranslate, type TranslateFunction } from './i18n';
import { SuggestionPlugin } from './suggestion-kit';
import { TITLE_BLOCK_TYPE } from './title';

export type SlashMenuItem = {
  icon: React.ReactNode;
  value: string;
  onSelect: (editor: PlateEditor, value: string) => void;
  className?: string;
  description?: string;
  focusEditor?: boolean;
  keywords?: string[];
  label?: string;
};

export type SlashMenuGroup = {
  /** Stable key, used to match groups (e.g. in `extendGroups`). */
  group: string;
  /** Displayed group name; defaults to `group`. */
  label?: string;
  items: SlashMenuItem[];
};

export type SlashMenuContext = {
  hasTitleBlock: boolean;
  t?: TranslateFunction;
};

export type SlashMenuConfig = {
  groups?: SlashMenuGroup[];
  getGroups?: (
    editor: PlateEditor,
    context: SlashMenuContext,
  ) => SlashMenuGroup[];
  extendGroups?: (
    groups: SlashMenuGroup[],
    editor: PlateEditor,
    context: SlashMenuContext,
  ) => SlashMenuGroup[];
};

const filteredBlocksConfig = (blocksConfig: Record<string, any>) =>
  Object.entries(blocksConfig ?? {}).filter(([, block]) => {
    const blockIsWellFormed = Boolean(block?.title && block?.id);
    if (!blockIsWellFormed) return false;
    if (typeof block?.restricted === 'boolean' && block.restricted) {
      return false;
    }
    return true;
  });

const insertSomersaultNativeBlock = (
  editor: PlateEditor,
  nativeBlockType: string,
) => {
  editor.tf.withoutNormalizing(() => {
    const block = editor.api.block();
    if (!block) return;

    editor.tf.insertNodes(
      editor.api.create.block({
        type: PLONE_BLOCK_TYPE,
        '@type': nativeBlockType,
      }),
      {
        at: PathApi.next(block[1]),
        select: true,
      },
    );

    if (block[0].type !== PLONE_BLOCK_TYPE) {
      editor.getApi(SuggestionPlugin).suggestion.withoutSuggestions(() => {
        editor.tf.removeNodes({ previousEmptyBlock: true });
      });
    }
  });
};

const addGroupItem = (
  groups: SlashMenuGroup[],
  groupName: SlashMenuGroup['group'],
  item: SlashMenuItem,
) =>
  groups.map((group) =>
    group.group === groupName
      ? {
          ...group,
          items: group.items.some((existing) => existing.value === item.value)
            ? group.items
            : [...group.items, item],
        }
      : group,
  );

// Only offered when the AI chat plugin is part of the editor preset.
const createAiActionsGroup = (t: TranslateFunction): SlashMenuGroup => ({
  group: 'Actions',
  label: t('plate.slashMenu.groups.actions', { defaultValue: 'Actions' }),
  items: [
    {
      focusEditor: false,
      icon: <SparklesIcon />,
      value: 'AI',
      onSelect: (editor) => {
        editor.getApi(AIChatPlugin).aiChat.show();
      },
    },
  ],
});

const createStaticGroups = (t: TranslateFunction): SlashMenuGroup[] => [
  {
    group: 'Text blocks',
    label: t('plate.slashMenu.groups.textBlocks', {
      defaultValue: 'Text blocks',
    }),
    items: [
      {
        icon: <PilcrowIcon />,
        keywords: ['paragraph'],
        label: t('plate.slashMenu.items.text', { defaultValue: 'Text' }),
        value: KEYS.p,
      },
      {
        icon: <Heading2Icon />,
        keywords: ['subtitle', 'h2'],
        label: t('plate.slashMenu.items.heading2', {
          defaultValue: 'Heading 2',
        }),
        value: KEYS.h2,
      },
      {
        icon: <Heading3Icon />,
        keywords: ['subtitle', 'h3'],
        label: t('plate.slashMenu.items.heading3', {
          defaultValue: 'Heading 3',
        }),
        value: KEYS.h3,
      },
      {
        icon: <Heading4Icon />,
        keywords: ['subtitle', 'h4'],
        label: t('plate.slashMenu.items.heading4', {
          defaultValue: 'Heading 4',
        }),
        value: KEYS.h4,
      },
      {
        icon: <Heading5Icon />,
        keywords: ['subtitle', 'h5'],
        label: t('plate.slashMenu.items.heading5', {
          defaultValue: 'Heading 5',
        }),
        value: KEYS.h5,
      },
      {
        icon: <Heading6Icon />,
        keywords: ['subtitle', 'h6'],
        label: t('plate.slashMenu.items.heading6', {
          defaultValue: 'Heading 6',
        }),
        value: KEYS.h6,
      },
      {
        icon: <ListIcon />,
        keywords: ['unordered', 'ul', '-'],
        label: t('plate.slashMenu.items.bulletedList', {
          defaultValue: 'Bulleted list',
        }),
        value: KEYS.ul,
      },
      {
        icon: <ListOrdered />,
        keywords: ['ordered', 'ol', '1'],
        label: t('plate.slashMenu.items.numberedList', {
          defaultValue: 'Numbered list',
        }),
        value: KEYS.ol,
      },
      {
        icon: <Square />,
        keywords: ['checklist', 'task', 'checkbox', '[]'],
        label: t('plate.slashMenu.items.todoList', {
          defaultValue: 'To-do list',
        }),
        value: KEYS.listTodo,
      },
      {
        icon: <ChevronRightIcon />,
        keywords: ['collapsible', 'expandable'],
        label: t('plate.slashMenu.items.toggle', { defaultValue: 'Toggle' }),
        value: KEYS.toggle,
      },
      {
        icon: <Code2 />,
        keywords: ['```'],
        label: t('plate.slashMenu.items.codeBlock', {
          defaultValue: 'Code Block',
        }),
        value: KEYS.codeBlock,
      },
      {
        icon: <Table />,
        label: t('plate.slashMenu.items.table', { defaultValue: 'Table' }),
        value: KEYS.table,
      },
      {
        icon: <Quote />,
        keywords: ['citation', 'blockquote', 'quote', '>'],
        label: t('plate.slashMenu.items.blockquote', {
          defaultValue: 'Blockquote',
        }),
        value: KEYS.blockquote,
      },
      {
        description: t('plate.slashMenu.items.calloutDescription', {
          defaultValue: 'Insert a highlighted block.',
        }),
        icon: <LightbulbIcon />,
        keywords: ['note'],
        label: t('plate.slashMenu.items.callout', { defaultValue: 'Callout' }),
        value: KEYS.callout,
      },
    ].map((item) => ({
      ...item,
      onSelect: (editor: PlateEditor, value: string) => {
        insertBlock(editor, value);
      },
    })),
  },
  {
    group: 'Advanced blocks',
    label: t('plate.slashMenu.groups.advancedBlocks', {
      defaultValue: 'Advanced blocks',
    }),
    items: [
      {
        icon: <TableOfContentsIcon />,
        keywords: ['toc'],
        label: t('plate.slashMenu.items.tableOfContents', {
          defaultValue: 'Table of contents',
        }),
        value: KEYS.toc,
      },
      {
        icon: <Columns3Icon />,
        label: t('plate.slashMenu.items.threeColumns', {
          defaultValue: '3 columns',
        }),
        value: 'action_three_columns',
      },
    ].map((item) => ({
      ...item,
      onSelect: (editor: PlateEditor, value: string) => {
        insertBlock(editor, value);
      },
    })),
  },
];

const createRegistryBlockItems = (t: TranslateFunction): SlashMenuItem[] => {
  const blocksConfig = config?.blocks?.blocksConfig;
  if (!blocksConfig) return [];

  return filteredBlocksConfig(blocksConfig).map(([id, block]: any) => {
    const label =
      typeof block.title === 'string'
        ? block.title
        : typeof block.title?.id === 'string'
          ? t(block.title.id, {
              defaultValue: block.title.defaultMessage ?? block.title.id,
            })
          : String(block.title);
    const Icon = block.icon ? block.icon : Square;

    return {
      icon: <Icon />,
      keywords: [id, label?.toString()?.toLowerCase?.()].filter(Boolean),
      label,
      value: `block_${id}`,
      onSelect: (editor: PlateEditor) => {
        insertSomersaultNativeBlock(editor, id);
      },
    };
  });
};

export const getDefaultSlashMenuGroups = (
  editor: PlateEditor,
  context: SlashMenuContext,
): SlashMenuGroup[] => {
  const t = context.t ?? fallbackTranslate;
  let groups = createStaticGroups(t);

  if (editor.plugins[AIChatPlugin.key]) {
    groups = [createAiActionsGroup(t), ...groups];
  }

  if (!context.hasTitleBlock) {
    groups = addGroupItem(groups, 'Text blocks', {
      icon: <BookA />,
      keywords: ['title', 'page title', 'h1'],
      label: t('plate.slashMenu.items.title', { defaultValue: 'Title' }),
      value: TITLE_BLOCK_TYPE,
      onSelect: (nextEditor: PlateEditor, value: string) => {
        insertBlock(nextEditor, value);
      },
    });
  }

  const blocks = createRegistryBlockItems(t);
  if (blocks.length) {
    groups = [
      ...groups,
      {
        group: 'Blocks',
        label: t('plate.slashMenu.groups.blocks', { defaultValue: 'Blocks' }),
        items: blocks,
      },
    ];
  }

  return groups;
};

export const resolveSlashMenuGroups = (
  editor: PlateEditor,
  config: SlashMenuConfig | undefined,
  context: SlashMenuContext,
): SlashMenuGroup[] => {
  const groups =
    config?.getGroups?.(editor, context) ??
    config?.groups ??
    getDefaultSlashMenuGroups(editor, context);

  return config?.extendGroups?.(groups, editor, context) ?? groups;
};

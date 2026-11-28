import { useTranslation } from 'react-i18next';
import { TooltipTrigger } from 'react-aria-components';
import { Button, Separator, Toolbar, Tooltip } from '@plone/quanta';

import {
  UploadIcon,
  StateIcon,
  BinIcon,
  PropertiesIcon,
  RenameIcon,
  TagIcon,
  CutIcon,
  CopyIcon,
  PasteIcon,
} from '@plone/icons';

import type { Brain } from '@plone/types';

import { useContentsContext } from '../providers/contents';

type Props = {
  upload: () => void | Promise<void>;
  rename: () => void | Promise<void>;
  workflow: () => void | Promise<void>;
  tags: () => void | Promise<void>;
  properties: () => void | Promise<void>;
  cut: (item?: Brain) => void;
  copy: (item?: Brain) => void;
  paste: () => Promise<void>;
  deleteItem: (item?: Brain | null | undefined) => void;
  canPaste: boolean;
  // selected: Set<Brain>;
};

export function ContentsActions({
  upload,
  rename,
  workflow,
  tags,
  properties,
  cut,
  copy,
  paste,
  deleteItem,
  canPaste,
  // selected,
}: Props) {
  const { t } = useTranslation();
  const { selected } = useContentsContext();

  const hasSelection = selected.size > 0;

  const action = (
    id: string,
    label: string,
    icon: React.ReactNode,
    onPress: () => void,
    isDisabled = false,
    className = '',
  ) => (
    <TooltipTrigger key={id}>
      <Button
        variant="icon"
        className={`
          contents-action-trigger
          ${id}
          ${className}
        `}
        onPress={onPress}
        isDisabled={isDisabled}
        aria-label={label}
      >
        {icon}
      </Button>
      <Tooltip placement="bottom">{label}</Tooltip>
    </TooltipTrigger>
  );

  // The actions always show, so users can find them before they can use
  // them: the ones that need a selection, or a clipboard, are disabled
  // until then. The toolbar is one tab stop, and the arrow keys move between
  // its enabled actions.
  return (
    <Toolbar
      aria-label={t('contents.actions.toolbar')}
      className="contents-actions flex-nowrap gap-1"
    >
      {action('upload', t('contents.actions.upload'), <UploadIcon />, upload)}
      {action(
        'rename',
        t('contents.actions.rename'),
        <RenameIcon />,
        rename,
        !hasSelection,
      )}
      {action(
        'state',
        t('contents.actions.state'),
        <StateIcon />,
        workflow,
        !hasSelection,
      )}
      {action(
        'tags',
        t('contents.actions.tags'),
        <TagIcon />,
        tags,
        !hasSelection,
      )}
      {action(
        'properties',
        t('contents.actions.properties'),
        <PropertiesIcon />,
        properties,
        !hasSelection,
      )}
      <Separator orientation="vertical" className="mx-1 h-6 bg-quanta-smoke" />
      {action(
        'cut',
        t('contents.actions.cut'),
        <CutIcon />,
        () => cut(),
        !hasSelection,
      )}
      {action(
        'copy',
        t('contents.actions.copy'),
        <CopyIcon />,
        () => copy(),
        !hasSelection,
      )}
      {action(
        'paste',
        t('contents.actions.paste'),
        <PasteIcon />,
        paste,
        !canPaste,
      )}
      {action(
        'delete',
        t('contents.actions.delete'),
        <BinIcon />,
        () => deleteItem(),
        !hasSelection,
        // Red only when it can be used: the disabled color says it cannot.
        hasSelection ? 'has-[svg]:text-quanta-candy' : '',
      )}
    </Toolbar>
  );
}

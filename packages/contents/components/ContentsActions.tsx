import { useTranslation } from 'react-i18next';
import { TooltipTrigger } from 'react-aria-components';
import { Button, Tooltip } from '@plone/quanta';

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

  // Every action stays visible, disabled until it can be used, so users do
  // not have to discover where they appear.
  return (
    <div className="contents-actions flex items-center gap-1">
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
      <span
        aria-hidden
        className="separator mx-1 h-6 border-s border-quanta-smoke"
      />
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
        hasSelection ? 'has-[svg]:text-quanta-candy' : '',
      )}
    </div>
  );
}

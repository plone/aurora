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
        aria-label={label}
      >
        {icon}
      </Button>
      <Tooltip placement="bottom">{label}</Tooltip>
    </TooltipTrigger>
  );

  return (
    <div className="contents-actions flex items-center gap-1">
      {action('upload', t('contents.actions.upload'), <UploadIcon />, upload)}
      {hasSelection && (
        <>
          {action(
            'rename',
            t('contents.actions.rename'),
            <RenameIcon />,
            rename,
          )}
          {action(
            'state',
            t('contents.actions.state'),
            <StateIcon />,
            workflow,
          )}
          {action('tags', t('contents.actions.tags'), <TagIcon />, tags)}
          {action(
            'properties',
            t('contents.actions.properties'),
            <PropertiesIcon />,
            properties,
          )}
        </>
      )}
      {(hasSelection || canPaste) && (
        <span
          aria-hidden
          className="separator mx-1 h-6 border-s border-quanta-smoke"
        />
      )}
      {hasSelection && (
        <>
          {action('cut', t('contents.actions.cut'), <CutIcon />, () => cut())}
          {action('copy', t('contents.actions.copy'), <CopyIcon />, () =>
            copy(),
          )}
        </>
      )}
      {canPaste &&
        action('paste', t('contents.actions.paste'), <PasteIcon />, paste)}
      {hasSelection &&
        action(
          'delete',
          t('contents.actions.delete'),
          <BinIcon />,
          () => deleteItem(),
          'has-[svg]:text-quanta-candy',
        )}
    </div>
  );
}

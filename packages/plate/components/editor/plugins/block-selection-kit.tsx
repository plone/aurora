import { BlockSelectionPlugin } from '@platejs/selection/react';
import { getPluginTypes, KEYS } from 'platejs';

import { BlockSelection } from '../../ui/block-selection';
import { handleSettingsBlockSelectionKeyDown } from './block-settings/block-settings-plugin';
import { GRID_COLUMN_KEY } from './grid/types';

export const BlockSelectionKit = [
  BlockSelectionPlugin.configure(({ editor }) => ({
    options: {
      enableContextMenu: true,
      // A block inside a container, such as an accordion panel, has its
      // own Esc and Delete.
      onKeyDownSelecting: (editor, event) => {
        handleSettingsBlockSelectionKeyDown(editor, event);
      },
      isSelectable: (element) => {
        return !getPluginTypes(editor, [
          KEYS.column,
          KEYS.codeLine,
          KEYS.td,
          GRID_COLUMN_KEY,
        ]).includes(element.type);
      },
    },
    render: {
      belowRootNodes: (props) => {
        if (!props.attributes.className?.includes('slate-selectable'))
          return null;

        return <BlockSelection {...(props as any)} />;
      },
    },
  })),
];

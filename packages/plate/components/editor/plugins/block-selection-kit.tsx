import { BlockSelectionPlugin } from '@platejs/selection/react';
import { getPluginTypes, KEYS } from 'platejs';

import { BlockSelection } from '../../ui/block-selection';
import { handleSettingsBlockSelectionKeyDown } from './block-settings/block-settings-plugin';

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

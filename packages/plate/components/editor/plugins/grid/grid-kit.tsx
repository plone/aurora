import { toPlatePlugin } from 'platejs/react';

import { GridColumnElement, GridElement } from '../../../ui/grid-node';
import {
  GridColumnSettingsLevelForm,
  GridSettingsLevelForm,
} from '../../../ui/grid-settings';
import { BlockSettingsKit } from '../block-settings/block-settings-kit';
import { GridDndKit } from './grid-dnd-kit';
import { GridEditorPlugin } from './grid-editor-plugin';
import { BaseGridColumnPlugin, BaseGridPlugin } from './grid-plugin';
import { gridColumnSettingsLevel, gridSettingsLevel } from './settings-levels';

export const GridPlugin = toPlatePlugin(BaseGridPlugin);
export const GridColumnPlugin = toPlatePlugin(BaseGridColumnPlugin);

export const GridKit = [
  ...BlockSettingsKit,
  ...GridDndKit,
  GridEditorPlugin,
  GridPlugin.withComponent(GridElement).configure({
    options: {
      settings: { ...gridSettingsLevel, component: GridSettingsLevelForm },
    },
  }),
  GridColumnPlugin.withComponent(GridColumnElement).configure({
    options: {
      settings: {
        ...gridColumnSettingsLevel,
        component: GridColumnSettingsLevelForm,
      },
    },
  }),
];

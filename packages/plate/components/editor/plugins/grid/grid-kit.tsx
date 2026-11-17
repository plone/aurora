import { toPlatePlugin } from 'platejs/react';

import { GridColumnElement, GridElement } from '../../../ui/grid-node';
import { BlockSettingsKit } from '../block-settings/block-settings-kit';
import { GridEditorPlugin } from './grid-editor-plugin';
import { BaseGridColumnPlugin, BaseGridPlugin } from './grid-plugin';

export const GridPlugin = toPlatePlugin(BaseGridPlugin);
export const GridColumnPlugin = toPlatePlugin(BaseGridColumnPlugin);

export const GridKit = [
  ...BlockSettingsKit,
  GridEditorPlugin,
  GridPlugin.withComponent(GridElement),
  GridColumnPlugin.withComponent(GridColumnElement),
];

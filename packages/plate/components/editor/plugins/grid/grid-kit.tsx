import { toPlatePlugin } from 'platejs/react';

import { GridColumnElement, GridElement } from '../../../ui/grid-node';
import { BaseGridColumnPlugin, BaseGridPlugin } from './grid-plugin';

export const GridPlugin = toPlatePlugin(BaseGridPlugin);
export const GridColumnPlugin = toPlatePlugin(BaseGridColumnPlugin);

export const GridKit = [
  GridPlugin.withComponent(GridElement),
  GridColumnPlugin.withComponent(GridColumnElement),
];

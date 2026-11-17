import {
  GridColumnElementStatic,
  GridElementStatic,
} from '../../../ui/grid-node-static';
import { BaseGridColumnPlugin, BaseGridPlugin } from './grid-plugin';

export const BaseGridKit = [
  BaseGridPlugin.withComponent(GridElementStatic),
  BaseGridColumnPlugin.withComponent(GridColumnElementStatic),
];

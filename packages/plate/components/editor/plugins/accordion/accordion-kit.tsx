import { toPlatePlugin } from 'platejs/react';

import {
  AccordionElement,
  AccordionPanelContentElement,
  AccordionPanelElement,
  AccordionPanelTitleElement,
} from '../../../ui/accordion-node';
import { AccordionInnerBlockWrapper } from '../../../ui/accordion-block-toolbar';
import { AccordionSettingsHost } from '../../../ui/accordion-settings';
import { AccordionEditorPlugin } from './accordion-editor-plugin';
import {
  BaseAccordionPanelContentPlugin,
  BaseAccordionPanelPlugin,
  BaseAccordionPanelTitlePlugin,
  BaseAccordionPlugin,
} from './accordion-plugin';

export const AccordionPlugin = toPlatePlugin(BaseAccordionPlugin);
export const AccordionPanelPlugin = toPlatePlugin(BaseAccordionPanelPlugin);
export const AccordionPanelTitlePlugin = toPlatePlugin(
  BaseAccordionPanelTitlePlugin,
);
export const AccordionPanelContentPlugin = toPlatePlugin(
  BaseAccordionPanelContentPlugin,
);

export const AccordionKit = [
  AccordionEditorPlugin.configure({
    render: {
      aboveNodes: AccordionInnerBlockWrapper,
      afterEditable: AccordionSettingsHost,
    },
  }),
  AccordionPlugin.withComponent(AccordionElement),
  AccordionPanelPlugin.withComponent(AccordionPanelElement),
  AccordionPanelTitlePlugin.withComponent(AccordionPanelTitleElement),
  AccordionPanelContentPlugin.withComponent(AccordionPanelContentElement),
];

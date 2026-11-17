import { toPlatePlugin } from 'platejs/react';

import {
  AccordionElement,
  AccordionPanelContentElement,
  AccordionPanelElement,
  AccordionPanelTitleElement,
} from '../../../ui/accordion-node';
import { AccordionInnerBlockWrapper } from '../../../ui/accordion-block-toolbar';
import {
  AccordionSettingsLevelForm,
  PanelSettingsLevelForm,
} from '../../../ui/accordion-settings';
import { BlockSettingsKit } from '../block-settings/block-settings-kit';
import { AccordionEditorPlugin } from './accordion-editor-plugin';
import {
  BaseAccordionPanelContentPlugin,
  BaseAccordionPanelPlugin,
  BaseAccordionPanelTitlePlugin,
  BaseAccordionPlugin,
} from './accordion-plugin';
import { accordionSettingsLevel, panelSettingsLevel } from './settings-levels';

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
    },
  }),
  ...BlockSettingsKit,
  AccordionPlugin.withComponent(AccordionElement).configure({
    options: {
      settings: {
        ...accordionSettingsLevel,
        component: AccordionSettingsLevelForm,
      },
    },
  }),
  AccordionPanelPlugin.withComponent(AccordionPanelElement).configure({
    options: {
      settings: { ...panelSettingsLevel, component: PanelSettingsLevelForm },
    },
  }),
  AccordionPanelTitlePlugin.withComponent(AccordionPanelTitleElement),
  AccordionPanelContentPlugin.withComponent(AccordionPanelContentElement),
];

import {
  AccordionElementStatic,
  AccordionPanelContentElementStatic,
  AccordionPanelElementStatic,
  AccordionPanelTitleElementStatic,
} from '../../../ui/accordion-node-static';
import {
  BaseAccordionPanelContentPlugin,
  BaseAccordionPanelPlugin,
  BaseAccordionPanelTitlePlugin,
  BaseAccordionPlugin,
} from './accordion-plugin';

export const BaseAccordionKit = [
  BaseAccordionPlugin.withComponent(AccordionElementStatic),
  BaseAccordionPanelPlugin.withComponent(AccordionPanelElementStatic),
  BaseAccordionPanelTitlePlugin.withComponent(AccordionPanelTitleElementStatic),
  BaseAccordionPanelContentPlugin.withComponent(
    AccordionPanelContentElementStatic,
  ),
];

import * as React from 'react';

import type { PlateElementProps } from 'platejs/react';

import clsx from 'clsx';
import { PlateElement } from 'platejs/react';

import {
  getAccordionOptions,
  resolveAccordionTheme,
} from '../editor/plugins/accordion/options';
import type {
  TAccordionElement,
  TAccordionPanelElement,
} from '../editor/plugins/accordion/types';
import { BlockInnerContainer } from './block-inner-container';

export function AccordionElement(props: PlateElementProps<TAccordionElement>) {
  const { children, editor, element } = props;
  const { themes } = getAccordionOptions(editor);
  const theme = resolveAccordionTheme(themes, element.theme);

  return (
    <PlateElement
      {...props}
      attributes={{
        ...props.attributes,
        'data-exclusive': element.exclusive === false ? 'false' : 'true',
        'data-theme': theme.id,
      }}
      style={
        {
          ...props.style,
          '--block-accordion-background': theme.color,
          '--theme-color': theme.color,
        } as React.CSSProperties
      }
    >
      <BlockInnerContainer>{children}</BlockInnerContainer>
    </PlateElement>
  );
}

export function AccordionPanelElement(
  props: PlateElementProps<TAccordionPanelElement>,
) {
  return (
    <PlateElement
      {...props}
      className={clsx(props.className, 'block-accordion__panel')}
      attributes={{ ...props.attributes, 'data-open': 'true' }}
    >
      {props.children}
    </PlateElement>
  );
}

export function AccordionPanelTitleElement(props: PlateElementProps) {
  return (
    <PlateElement
      {...props}
      className={clsx(props.className, 'block-accordion__heading')}
    >
      <div className="block-accordion__title">{props.children}</div>
    </PlateElement>
  );
}

export function AccordionPanelContentElement(props: PlateElementProps) {
  return (
    <PlateElement
      {...props}
      className={clsx(props.className, 'block-accordion__content')}
    >
      {props.children}
    </PlateElement>
  );
}

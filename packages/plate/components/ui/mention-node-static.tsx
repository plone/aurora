import * as React from 'react';

import type { TMentionElement } from 'platejs';
import type { SlateElementProps } from 'platejs/static';

import { KEYS } from 'platejs';
import { SlateElement } from 'platejs/static';

/**
 * The marks of a mention's text, as data attributes: `.slate-mention` in
 * `styles/content.css` styles `[data-bold]`, `[data-italic]` and
 * `[data-underline]`.
 */
export function mentionMarkAttributes(element: TMentionElement) {
  const text = element.children[0];
  return {
    'data-bold': text[KEYS.bold] === true ? '' : undefined,
    'data-italic': text[KEYS.italic] === true ? '' : undefined,
    'data-underline': text[KEYS.underline] === true ? '' : undefined,
  };
}

export function MentionElementStatic(
  props: SlateElementProps<TMentionElement> & {
    prefix?: string;
  },
) {
  const { prefix } = props;
  const element = props.element;

  return (
    <SlateElement
      {...props}
      attributes={{
        ...props.attributes,
        ...mentionMarkAttributes(element),
        'data-slate-value': element.value,
      }}
    >
      <React.Fragment>
        {props.children}
        {prefix}
        {element.value}
      </React.Fragment>
    </SlateElement>
  );
}

import type { TInlineSuggestionData, TLinkElement } from 'platejs';
import type { PlateElementProps } from 'platejs/react';

import config from '@plone/registry';
import { PlateElement } from 'platejs/react';

import type { ComponentProps } from 'react';
import type { Link as RACLink } from 'react-aria-components';
import { cn } from '../../lib/utils';
import { SuggestionPlugin } from '../editor/plugins/suggestion-kit';

// `@plone/layout` registers `Link`, but plate can't depend on it. The
// `@plone/components` `Link` is React Aria's, so this declaration matches
// layout's and the two merge.
declare module '@plone/types' {
  export interface ComponentsPropsMap {
    Link: ComponentProps<typeof RACLink>;
  }
}

export function LinkElement(props: PlateElementProps<TLinkElement>) {
  const Link = config.getComponent('Link').component!;
  const suggestionData = props.editor
    .getApi(SuggestionPlugin)
    .suggestion.suggestionData(props.element) as
    TInlineSuggestionData | undefined;

  return (
    <PlateElement
      {...props}
      as="span"
      className={cn(
        suggestionData?.type === 'remove' && 'bg-red-100 text-red-700',
        suggestionData?.type === 'insert' && 'bg-emerald-100 text-emerald-700',
      )}
      attributes={props.attributes}
    >
      <Link
        href={props.element.url}
        target={props.element.target}
        rel={props.element.target === '_blank' ? 'noreferrer' : undefined}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onAuxClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onMouseOver={(e) => {
          e.stopPropagation();
        }}
      >
        {props.children}
      </Link>
    </PlateElement>
  );
}

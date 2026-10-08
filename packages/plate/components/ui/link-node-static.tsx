import type { TLinkElement } from 'platejs';
import type { SlateElementProps } from 'platejs/static';

import { Link } from '@plone/components';
import { SlateElement } from 'platejs/static';

export function LinkElementStatic(props: SlateElementProps<TLinkElement>) {
  return (
    <SlateElement {...props} as="span" attributes={props.attributes}>
      <Link
        href={props.element.url}
        target={props.element.target}
        rel={props.element.target === '_blank' ? 'noreferrer' : undefined}
      >
        {props.children}
      </Link>
    </SlateElement>
  );
}

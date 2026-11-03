import type { TLinkElement } from 'platejs';
import type { SlateElementProps } from 'platejs/static';

import config from '@plone/registry';
import { SlateElement } from 'platejs/static';

export function LinkElementStatic(props: SlateElementProps<TLinkElement>) {
  const Link = config.getComponent('Link').component!;

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

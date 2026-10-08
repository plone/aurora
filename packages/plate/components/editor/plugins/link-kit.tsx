import { LinkRules } from '@platejs/link';
import { LinkPlugin } from '@platejs/link/react';

import { LinkElement } from '../../ui/link-node';
import { LinkFloatingToolbar } from '../../ui/link-toolbar';

export const LinkKit = [
  LinkPlugin.configure({
    inputRules: [
      LinkRules.markdown(),
      LinkRules.autolink({ variant: 'paste' }),
      LinkRules.autolink({ variant: 'space' }),
      LinkRules.autolink({ variant: 'break' }),
    ],
    render: {
      node: LinkElement,
      afterEditable: () => <LinkFloatingToolbar />,
    },
  }),
];

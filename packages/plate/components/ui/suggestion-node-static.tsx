import type { SlateLeafProps, TSuggestionText } from 'platejs';

import { SlateLeaf } from 'platejs';

import { cn } from '../../lib/utils';
import { BaseSuggestionPlugin } from '../editor/plugins/suggestion-kit';

export function SuggestionLeafStatic(props: SlateLeafProps<TSuggestionText>) {
  const { editor, leaf } = props;

  const dataList = editor
    .getApi(BaseSuggestionPlugin)
    .suggestion.dataList(leaf);
  const hasRemove = dataList.some((data: any) => data.type === 'remove');
  const diffOperation = { type: hasRemove ? 'delete' : 'insert' } as const;

  const Component = ({ delete: 'del', insert: 'ins', update: 'span' } as const)[
    diffOperation.type
  ];

  return (
    <SlateLeaf
      {...props}
      as={Component}
      className={cn(
        `
          border-b-quanta-emerald/40 bg-quanta-emerald/10 text-quanta-emerald border-b-2
          no-underline transition-colors duration-200
        `,
        hasRemove &&
          'bg-quanta-rose/15 text-quanta-rose border-b-0 line-through',
      )}
    >
      {props.children}
    </SlateLeaf>
  );
}

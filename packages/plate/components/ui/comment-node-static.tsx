import type { TCommentText } from 'platejs';
import type { SlateLeafProps } from 'platejs/static';

import { SlateLeaf } from 'platejs/static';

export function CommentLeafStatic(props: SlateLeafProps<TCommentText>) {
  return (
    <SlateLeaf
      {...props}
      className="border-b-highlight/35 bg-highlight/15 border-b-2"
    >
      {props.children}
    </SlateLeaf>
  );
}

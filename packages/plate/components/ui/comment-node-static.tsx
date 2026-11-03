import type { TCommentText } from 'platejs';
import type { SlateLeafProps } from 'platejs/static';

import { SlateLeaf } from 'platejs/static';

// Comments are an editorial tool: the rendered content shows commented text
// as plain text. The editor highlights it (`comment-node.tsx`).
export function CommentLeafStatic(props: SlateLeafProps<TCommentText>) {
  return <SlateLeaf {...props}>{props.children}</SlateLeaf>;
}

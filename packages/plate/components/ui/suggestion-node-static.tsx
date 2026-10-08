import type { TSuggestionText } from 'platejs';
import type { SlateLeafProps } from 'platejs/static';

import { SlateLeaf } from 'platejs/static';

// Suggestions are an editorial tool: the rendered content shows suggested
// text as plain text, without insert or delete markup. The editor shows the
// suggestion (`suggestion-node.tsx`).
export function SuggestionLeafStatic(props: SlateLeafProps<TSuggestionText>) {
  return <SlateLeaf {...props}>{props.children}</SlateLeaf>;
}

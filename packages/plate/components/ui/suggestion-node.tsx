import * as React from 'react';

import type { TSuggestionData, TSuggestionText } from 'platejs';
import type { PlateLeafProps, RenderNodeWrapper } from 'platejs/react';

import { CornerDownLeftIcon } from 'lucide-react';
import { PlateLeaf, useEditorPlugin, usePluginOption } from 'platejs/react';

import { cn } from '../../lib/utils';
import {
  type SuggestionConfig,
  suggestionPlugin,
} from '../editor/plugins/suggestion-kit';

export function SuggestionLeaf(props: PlateLeafProps<TSuggestionText>) {
  const { api, setOption } = useEditorPlugin(suggestionPlugin);
  const leaf = props.leaf;

  const leafId: string = api.suggestion.nodeId(leaf) ?? '';
  const activeSuggestionId = usePluginOption(suggestionPlugin, 'activeId');
  const hoverSuggestionId = usePluginOption(suggestionPlugin, 'hoverId');
  const dataList = api.suggestion.dataList(leaf);

  const hasRemove = dataList.some((data) => data.type === 'remove');
  const hasActive = dataList.some((data) => data.id === activeSuggestionId);
  const hasHover = dataList.some((data) => data.id === hoverSuggestionId);

  const diffOperation = { type: hasRemove ? 'delete' : 'insert' } as const;

  const Component = ({ delete: 'del', insert: 'ins', update: 'span' } as const)[
    diffOperation.type
  ];

  return (
    <PlateLeaf
      {...props}
      as={Component}
      className={cn(
        `
          border-b-quanta-emerald/40 bg-quanta-emerald/10 text-quanta-emerald border-b-2
          no-underline transition-colors duration-200
        `,
        (hasActive || hasHover) &&
          'border-b-quanta-emerald/60 bg-quanta-emerald/20',
        hasRemove &&
          'bg-quanta-rose/15 text-quanta-rose border-b-0 line-through',
        (hasActive || hasHover) && hasRemove && 'bg-quanta-rose/25',
      )}
      attributes={{
        ...props.attributes,
        'data-suggestion-id': leafId,
        onMouseEnter: () => setOption('hoverId', leafId),
        onMouseLeave: () => setOption('hoverId', null),
      }}
    >
      {props.children}
    </PlateLeaf>
  );
}

export const SuggestionLineBreak: RenderNodeWrapper<SuggestionConfig> = ({
  api,
  element,
}) => {
  if (!api.suggestion.isBlockSuggestion(element)) return;

  const suggestionData = element.suggestion;

  if (!suggestionData?.isLineBreak) return;

  // eslint-disable-next-line react/prop-types
  return function Component({ children }) {
    return (
      <React.Fragment>
        {children}
        <SuggestionLineBreakContent suggestionData={suggestionData} />
      </React.Fragment>
    );
  };
};

function SuggestionLineBreakContent({
  suggestionData,
}: {
  suggestionData: TSuggestionData;
}) {
  const { type } = suggestionData;
  const isRemove = type === 'remove';
  const isInsert = type === 'insert';

  const activeSuggestionId = usePluginOption(suggestionPlugin, 'activeId');
  const hoverSuggestionId = usePluginOption(suggestionPlugin, 'hoverId');

  const isActive = activeSuggestionId === suggestionData.id;
  const isHover = hoverSuggestionId === suggestionData.id;

  const spanRef = React.useRef<HTMLSpanElement>(null);

  return (
    <span
      ref={spanRef}
      className={cn(
        `
          border-b-quanta-emerald/40 bg-quanta-emerald/10 text-quanta-emerald absolute border-b-2
          text-justify no-underline transition-colors duration-200
        `,
        isInsert &&
          (isActive || isHover) &&
          'border-b-quanta-emerald/60 bg-quanta-emerald/20',
        isRemove &&
          'bg-quanta-rose/15 text-quanta-rose border-b-0 line-through',
        isRemove &&
          (isActive || isHover) &&
          'bg-quanta-rose/25 text-quanta-rose no-underline',
      )}
      style={{
        bottom: 4.5,
        height: 21,
      }}
      contentEditable={false}
    >
      <CornerDownLeftIcon className="mt-0.5 size-4" />
    </span>
  );
}

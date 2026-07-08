import * as React from 'react';

import type { PlateElementProps, RenderNodeWrapper } from 'platejs/react';

import { getDraftCommentKey } from '@platejs/comment';
import { CommentPlugin } from '@platejs/comment/react';
import { getTransientSuggestionKey } from '@platejs/suggestion';
import {
  MessageSquareTextIcon,
  MessagesSquareIcon,
  PencilLineIcon,
  XIcon,
} from 'lucide-react';
import {
  type AnyPluginConfig,
  type NodeEntry,
  type Path,
  type TCommentText,
  type TElement,
  type TSuggestionText,
  PathApi,
  TextApi,
} from 'platejs';
import { useEditorPlugin, useEditorRef, usePluginOption } from 'platejs/react';

import { Button } from './button';
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
} from './popover';
import { usePlatePlugins } from '../editor/plate-plugins-context';
import { commentPlugin } from '../editor/plugins/comment-kit';
import { type TDiscussion } from '../editor/plugins/discussion-kit';
import {
  SuggestionPlugin,
  suggestionPlugin,
} from '../editor/plugins/suggestion-kit';

import {
  BlockSuggestionCard,
  isResolvedSuggestion,
  useResolveSuggestion,
} from './block-suggestion';
import { Comment, CommentCreateForm } from './comment';

export const discussionPopoverContentClassName = `
  max-h-[min(70dvh,calc(-24px+var(--radix-popper-available-height)))]
  w-[min(420px,calc(100vw-24px))] min-w-[300px] overflow-y-auto
  rounded-[16px] border border-[#c7d6dc] bg-white p-0
  shadow-[0_18px_48px_rgba(15,23,42,0.16)]
  data-[state=closed]:opacity-0
`;

export const discussionTriggerClassName = `
  mt-1 ml-1 flex h-9 min-w-12 gap-1.5 rounded-md border-2
  border-[#0067c7] bg-[#f3fbff] px-2.5 py-0 text-[#0073b5]
  shadow-none hover:bg-[#edf8ff] hover:text-[#0073b5]
  data-[active=true]:bg-[#e9f7ff]
`;

export function DiscussionPopoverHeader({
  count,
  onClose,
  title,
}: {
  count: number;
  onClose: () => void;
  title: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 px-6 pt-5 pb-3">
      <h3 className="text-lg leading-none font-bold tracking-[0.06em] text-[#2b2b2b] uppercase">
        {title} ({count})
      </h3>
      <Button
        aria-label="Close"
        className="size-7 rounded-full p-0 text-[#7c858b] hover:bg-slate-100 hover:text-[#2b2b2b]"
        onClick={onClose}
        type="button"
        variant="ghost"
      >
        <XIcon className="size-5 stroke-[1.75]" />
      </Button>
    </div>
  );
}

export const BlockDiscussion: RenderNodeWrapper<AnyPluginConfig> = (props) => {
  const { editor, element } = props;

  const commentsApi = editor.getApi(CommentPlugin).comment;
  const blockPath = editor.api.findPath(element);

  // avoid duplicate in table or column
  if (!blockPath || blockPath.length > 1) return;

  const draftCommentNode = commentsApi.node({ at: blockPath, isDraft: true });

  const commentNodes = [...commentsApi.nodes({ at: blockPath })];

  const suggestionNodes = [
    ...editor.getApi(SuggestionPlugin).suggestion.nodes({ at: blockPath }),
  ].filter(([node]) => !node[getTransientSuggestionKey()]);

  if (
    commentNodes.length === 0 &&
    suggestionNodes.length === 0 &&
    !draftCommentNode
  ) {
    return;
  }

  // eslint-disable-next-line react/display-name
  return (props) => (
    <BlockCommentContent
      blockPath={blockPath}
      commentNodes={commentNodes}
      draftCommentNode={draftCommentNode}
      suggestionNodes={suggestionNodes}
      {...props}
    />
  );
};

const BlockCommentContent = ({
  blockPath,
  children,
  commentNodes,
  draftCommentNode,
  suggestionNodes,
}: PlateElementProps & {
  blockPath: Path;
  commentNodes: NodeEntry<TCommentText>[];
  draftCommentNode: NodeEntry<TCommentText> | undefined;
  suggestionNodes: NodeEntry<TElement | TSuggestionText>[];
}) => {
  const editor = useEditorRef();
  const resolvedSuggestions = useResolveSuggestion(suggestionNodes, blockPath);
  const resolvedDiscussions = useResolvedDiscussion(commentNodes, blockPath);

  const suggestionsCount = resolvedSuggestions.length;
  const discussionsCount = resolvedDiscussions.length;
  const totalCount = suggestionsCount + discussionsCount;
  const popoverTitle =
    suggestionsCount > 0 && discussionsCount === 0
      ? 'Suggestions'
      : discussionsCount > 0 && suggestionsCount === 0
        ? 'Comments'
        : 'Comments & Suggestions';

  const activeSuggestionId = usePluginOption(suggestionPlugin, 'activeId');
  const activeSuggestion =
    activeSuggestionId &&
    resolvedSuggestions.find((s) => s.suggestionId === activeSuggestionId);

  const commentingBlock = usePluginOption(commentPlugin, 'commentingBlock');
  const activeCommentId = usePluginOption(commentPlugin, 'activeId');
  const isCommenting = activeCommentId === getDraftCommentKey();
  const activeDiscussion =
    activeCommentId &&
    resolvedDiscussions.find((d) => d.id === activeCommentId);

  const noneActive = !activeSuggestion && !activeDiscussion;
  const popoverHeaderCount = noneActive
    ? totalCount
    : activeDiscussion
      ? activeDiscussion.comments.length
      : 1;

  const sortedMergedData = [
    ...resolvedDiscussions,
    ...resolvedSuggestions,
  ].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  const selected =
    resolvedDiscussions.some((d) => d.id === activeCommentId) ||
    resolvedSuggestions.some((s) => s.suggestionId === activeSuggestionId);

  const [_open, setOpen] = React.useState(selected);

  // in some cases, we may comment the multiple blocks
  const commentingCurrent =
    !!commentingBlock && PathApi.equals(blockPath, commentingBlock);

  const open =
    _open ||
    selected ||
    (isCommenting && !!draftCommentNode && commentingCurrent);

  const closePopover = React.useCallback(() => {
    if (isCommenting && draftCommentNode) {
      editor.tf.unsetNodes(getDraftCommentKey(), {
        at: [],
        mode: 'lowest',
        match: (n) => n[getDraftCommentKey()],
      });
    }

    setOpen(false);
  }, [draftCommentNode, editor.tf, isCommenting]);

  const anchorElement = React.useMemo(() => {
    let activeNode: NodeEntry | undefined;

    if (activeSuggestion) {
      activeNode = suggestionNodes.find(
        ([node]) =>
          TextApi.isText(node) &&
          editor.getApi(SuggestionPlugin).suggestion.nodeId(node) ===
            activeSuggestion.suggestionId,
      );
    }

    if (activeCommentId) {
      if (activeCommentId === getDraftCommentKey()) {
        activeNode = draftCommentNode;
      } else {
        activeNode = commentNodes.find(
          ([node]) =>
            editor.getApi(commentPlugin).comment.nodeId(node) ===
            activeCommentId,
        );
      }
    }

    if (!activeNode) return null;

    return editor.api.toDOMNode(activeNode[0])!;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    open,
    activeSuggestion,
    activeCommentId,
    editor.api,
    suggestionNodes,
    draftCommentNode,
    commentNodes,
  ]);

  if (suggestionsCount + resolvedDiscussions.length === 0 && !draftCommentNode)
    return <div className="w-full">{children}</div>;

  return (
    <div className="flex w-full justify-between">
      <Popover
        open={open}
        onOpenChange={(_open_) => {
          if (!_open_) {
            closePopover();
            return;
          }

          setOpen(_open_);
        }}
      >
        <div className="w-full">{children}</div>
        {anchorElement && (
          <PopoverAnchor
            asChild
            className="w-full"
            virtualRef={{ current: anchorElement }}
          />
        )}

        <PopoverContent
          className={discussionPopoverContentClassName}
          onCloseAutoFocus={(e) => e.preventDefault()}
          onOpenAutoFocus={(e) => e.preventDefault()}
          align="center"
          side="bottom"
        >
          {isCommenting ? (
            <CommentCreateForm className="p-4" focusOnMount />
          ) : (
            <React.Fragment>
              <DiscussionPopoverHeader
                count={popoverHeaderCount}
                onClose={closePopover}
                title={popoverTitle}
              />
              {noneActive ? (
                sortedMergedData.map((item, index) =>
                  isResolvedSuggestion(item) ? (
                    <BlockSuggestionCard
                      key={item.suggestionId}
                      idx={index}
                      isLast={index === sortedMergedData.length - 1}
                      suggestion={item}
                    />
                  ) : (
                    <BlockComment
                      key={item.id}
                      discussion={item}
                      isLast={index === sortedMergedData.length - 1}
                    />
                  ),
                )
              ) : (
                <React.Fragment>
                  {activeSuggestion && (
                    <BlockSuggestionCard
                      key={activeSuggestion.suggestionId}
                      idx={0}
                      isLast={true}
                      suggestion={activeSuggestion}
                    />
                  )}

                  {activeDiscussion && (
                    <BlockComment discussion={activeDiscussion} isLast={true} />
                  )}
                </React.Fragment>
              )}
            </React.Fragment>
          )}
        </PopoverContent>

        {totalCount > 0 && (
          <div className="relative left-0 size-0 select-none">
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className={discussionTriggerClassName}
                data-active={open}
                contentEditable={false}
              >
                {suggestionsCount > 0 && discussionsCount === 0 && (
                  <PencilLineIcon className="size-5 shrink-0 text-[#4caf50]" />
                )}

                {suggestionsCount === 0 && discussionsCount > 0 && (
                  <MessageSquareTextIcon className="size-5 shrink-0" />
                )}

                {suggestionsCount > 0 && discussionsCount > 0 && (
                  <MessagesSquareIcon className="size-5 shrink-0" />
                )}

                <span className="text-base leading-none font-medium">
                  {totalCount}
                </span>
              </Button>
            </PopoverTrigger>
          </div>
        )}
      </Popover>
    </div>
  );
};

function BlockComment({
  discussion,
  isLast,
}: {
  discussion: TDiscussion;
  isLast: boolean;
}) {
  const [editingId, setEditingId] = React.useState<string | null>(null);

  return (
    <React.Fragment key={discussion.id}>
      <div className="px-6 pb-5">
        {discussion.comments.map((comment, index) => (
          <Comment
            key={comment.id ?? index}
            comment={comment}
            discussionLength={discussion.comments.length}
            documentContent={discussion?.documentContent}
            editingId={editingId}
            index={index}
            setEditingId={setEditingId}
            showDocumentContent
          />
        ))}
        <CommentCreateForm discussionId={discussion.id} />
      </div>

      {!isLast && <div className="h-px w-full bg-muted" />}
    </React.Fragment>
  );
}

const useResolvedDiscussion = (
  commentNodes: NodeEntry<TCommentText>[],
  blockPath: Path,
) => {
  const { api, getOption, setOption } = useEditorPlugin(commentPlugin);
  const { discussions } = usePlatePlugins();

  commentNodes.forEach(([node]) => {
    const id = api.comment.nodeId(node);
    const map = getOption('uniquePathMap');

    if (!id) return;

    const previousPath = map.get(id);

    // If there are no comment nodes in the corresponding path in the map, then update it.
    if (PathApi.isPath(previousPath)) {
      const nodes = api.comment.node({ id, at: previousPath });

      if (!nodes) {
        setOption('uniquePathMap', new Map(map).set(id, blockPath));
        return;
      }

      return;
    }
    // TODO: fix throw error
    setOption('uniquePathMap', new Map(map).set(id, blockPath));
  });

  const commentsIds = new Set(
    commentNodes.map(([node]) => api.comment.nodeId(node)).filter(Boolean),
  );

  const resolvedDiscussions = discussions
    .map((d: TDiscussion) => ({
      ...d,
      createdAt: new Date(d.createdAt),
    }))
    .filter((item: TDiscussion) => {
      /** If comment cross blocks just show it in the first block */
      const commentsPathMap = getOption('uniquePathMap');
      const firstBlockPath = commentsPathMap.get(item.id);

      if (!firstBlockPath) return false;
      if (!PathApi.equals(firstBlockPath, blockPath)) return false;

      return (
        api.comment.has({ id: item.id }) &&
        commentsIds.has(item.id) &&
        !item.isResolved
      );
    });

  return resolvedDiscussions;
};

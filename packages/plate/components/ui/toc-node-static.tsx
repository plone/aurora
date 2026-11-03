import type { SlateEditor, TElement } from 'platejs';
import type { SlateElementProps } from 'platejs/static';

import { type Heading, BaseTocPlugin, isHeading } from '@platejs/toc';
import { NodeApi } from 'platejs';
import { SlateElement } from 'platejs/static';

import { BlockInnerContainer } from './block-inner-container';

export function TocElementStatic(props: SlateElementProps) {
  const { editor } = props;
  const headingList = getHeadingList(editor);

  return (
    <SlateElement {...props}>
      <BlockInnerContainer>
        <div>
          {headingList.length > 0 ? (
            headingList.map((item) => (
              <button
                key={item.title}
                type="button"
                className="block-toc__item"
                data-depth={item.depth}
                // This handler mocks the behaviour inside the edit view,
                // since the heading highlighting is coupled to the editor
                onClick={() => {
                  const el = document.querySelector<HTMLElement>(
                    `[data-block-id="${item.id}"]`,
                  );
                  if (!el) return;
                  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  const overlay = document.createElement('div');
                  overlay.className = 'block-toc__highlight';
                  overlay.dataset.slot = 'block-selection';
                  el.appendChild(overlay);
                  const dismiss = () => {
                    overlay.remove();
                    document.removeEventListener('mousedown', dismiss);
                  };
                  document.addEventListener('mousedown', dismiss);
                }}
              >
                {item.title}
              </button>
            ))
          ) : (
            <div className="block-toc__empty">
              Create a heading to display the table of contents.
            </div>
          )}
        </div>
        {props.children}
      </BlockInnerContainer>
    </SlateElement>
  );
}

const headingDepth: Record<string, number> = {
  h1: 1,
  h2: 2,
  h3: 3,
  h4: 4,
  h5: 5,
  h6: 6,
};

const getHeadingList = (editor?: SlateEditor) => {
  if (!editor) return [];

  const options = editor.getOptions(BaseTocPlugin);

  if (options.queryHeading) {
    return options.queryHeading(editor);
  }

  const headingList: Heading[] = [];

  const values = editor.api.nodes<TElement>({
    at: [],
    match: (n) => isHeading(n),
  });

  if (!values) return [];

  Array.from(values, ([node, path]) => {
    const { type } = node;
    const title = NodeApi.string(node);
    const depth = headingDepth[type];
    const id = node.id as string;

    if (title) {
      headingList.push({ id, depth, path, title, type });
    }
  });

  return headingList;
};

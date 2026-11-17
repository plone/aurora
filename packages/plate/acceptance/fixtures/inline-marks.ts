/**
 * Plate values for the inline marks and elements the native blocks fixture
 * doesn't use. Pass them as `extra` to `createNativeBlocksPage`.
 */

type Node = Record<string, unknown>;

/** Keyboard input, highlight and mentions, next to inline code and a link. */
export const INLINE_MARKS: Node[] = [
  {
    type: 'p',
    children: [
      { text: 'Press ' },
      { text: 'Ctrl', kbd: true },
      { text: ' + ' },
      { text: 'S', kbd: true },
      { text: ' to save, then check the ' },
      { text: 'highlighted text', highlight: true },
      { text: ', the ' },
      { text: 'inline code', code: true },
      { text: ' and the ' },
      {
        type: 'a',
        url: 'https://plone.org',
        children: [{ text: 'link' }],
      },
      { text: '.' },
    ],
  },
  {
    type: 'p',
    children: [
      { text: 'Ask ' },
      { type: 'mention', value: 'Alice', children: [{ text: '' }] },
      { text: ' or ' },
      {
        type: 'mention',
        value: 'Bob',
        children: [{ text: '', bold: true }],
      },
      { text: ' about it.' },
    ],
  },
];

/** Comment and suggestion marks, which the public view renders as text. */
export const EDITORIAL_MARKS: Node[] = [
  {
    type: 'p',
    children: [
      { text: 'Some ' },
      { text: 'commented', comment: true, comment_c1: true },
      { text: ' text, an ' },
      {
        text: 'inserted',
        suggestion: true,
        suggestion_s1: {
          id: 's1',
          type: 'insert',
          userId: 'admin',
          createdAt: 0,
        },
      },
      { text: ' word and a ' },
      {
        text: 'removed',
        suggestion: true,
        suggestion_s2: {
          id: 's2',
          type: 'remove',
          userId: 'admin',
          createdAt: 0,
        },
      },
      { text: ' one.' },
    ],
  },
];

import type { Meta, StoryObj } from '@storybook/react-vite';

import '../styles/content.css';
import { PlateEditor, type Value } from '../components/editor';
import plateBlockEditorConfig from '../config/presets/block-editor';

// The grid in the editor with the `block-editor` preset, which has no site
// configuration: what any editor that installs `@plone/plate` gets. Type "/"
// in an empty paragraph to insert another grid.

const p = (text: string) => ({ type: 'p', children: [{ text }] });
const h3 = (text: string) => ({ type: 'h3', children: [{ text }] });

const column = (id: string, size: number, blocks: object[]) => ({
  type: 'grid_column',
  id,
  size,
  children: blocks,
});

const grid = (
  columns: ReturnType<typeof column>[],
  extra: Record<string, unknown> = {},
): Value =>
  [
    p('Our galleries are open all year. Plan your visit below.'),
    {
      type: 'grid',
      id: 'plan-your-visit',
      theme: 'default',
      gap: 'm',
      stack: true,
      ...extra,
      children: columns,
    },
    p(''),
  ] as Value;

const meta = {
  title: 'Blocks/Grid/Editor',
  component: PlateEditor,
  parameters: {
    layout: 'padded',
  },
  render: (args) => (
    <div className="mx-auto w-[760px]">
      <PlateEditor {...args} />
    </div>
  ),
} satisfies Meta<typeof PlateEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TwoColumns: Story = {
  args: {
    editorConfig: plateBlockEditorConfig,
    onChange: () => {},
    value: grid([
      column('visit', 2, [
        h3('Visit us'),
        p('Open Tuesday to Sunday, 10:00 to 18:00.'),
      ]),
      column('tours', 1, [h3('Guided tours'), p('Every hour, from the hall.')]),
    ]),
  },
};

export const NewGrid: Story = {
  args: {
    editorConfig: plateBlockEditorConfig,
    onChange: () => {},
    value: grid([column('first', 1, [p('')]), column('second', 1, [p('')])]),
  },
};

export const HeadlineAndGreyBackground: Story = {
  args: {
    editorConfig: plateBlockEditorConfig,
    onChange: () => {},
    value: grid(
      [
        column('visit', 1, [p('Open Tuesday to Sunday.')]),
        column('shop', 1, [p('Books, prints and gifts.')]),
        column('cafe', 1, [p('Lunch from noon to three.')]),
      ],
      { headline: 'Plan your visit', theme: 'grey' },
    ),
  },
};

// With 4 columns, the most by default: no insert points, and Duplicate is
// disabled.
export const FullGrid: Story = {
  args: {
    editorConfig: plateBlockEditorConfig,
    onChange: () => {},
    value: grid([
      column('one', 1, [p('One')]),
      column('two', 1, [p('Two')]),
      column('three', 1, [p('Three')]),
      column('four', 1, [p('Four')]),
    ]),
  },
};

import type { Meta, StoryObj } from '@storybook/react-vite';

import '../styles/content.css';
import { PlateRenderer, type Value } from '../components/editor';
import plateBlockRendererConfig from '../config/presets/block-renderer';

// The published view of the grid with the `block-renderer` preset, which
// has no site configuration: what any editor that installs `@plone/plate`
// renders. The narrow story shows the columns stacking on the grid's own
// width.

const p = (text: string) => ({ type: 'p', children: [{ text }] });
const h3 = (text: string) => ({ type: 'h3', children: [{ text }] });

const column = (id: string, size: number, blocks: object[]) => ({
  type: 'grid_column',
  id,
  size,
  children: blocks,
});

const columns = {
  visit: column('visit', 1, [
    h3('Visit us'),
    p(
      'Open Tuesday to Sunday, 10:00 to 18:00. Free entry on the first Sunday of the month.',
    ),
  ]),
  tours: column('tours', 1, [
    h3('Guided tours'),
    p('Tours start at the main entrance every hour.'),
  ]),
  shop: column('shop', 1, [h3('Shop'), p('Books, prints and gifts.')]),
  cafe: column('cafe', 1, [h3('Café'), p('Lunch from noon to three.')]),
};

const grid = (
  cols: ReturnType<typeof column>[],
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
      children: cols,
    },
    p('We look forward to seeing you.'),
  ] as Value;

const sized = (sizes: number[]) =>
  Object.values(columns)
    .slice(0, sizes.length)
    .map((item, index) => ({ ...item, size: sizes[index] }));

const meta = {
  title: 'Blocks/Grid/Published view',
  component: PlateRenderer,
  parameters: {
    layout: 'padded',
  },
  render: (args) => (
    <div className="mx-auto w-[760px]">
      <PlateRenderer {...args} />
    </div>
  ),
} satisfies Meta<typeof PlateRenderer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TwoEqualColumns: Story = {
  args: { editorConfig: plateBlockRendererConfig, value: grid(sized([1, 1])) },
};

export const TwoToOne: Story = {
  args: { editorConfig: plateBlockRendererConfig, value: grid(sized([2, 1])) },
};

export const ThreeColumns: Story = {
  args: {
    editorConfig: plateBlockRendererConfig,
    value: grid(sized([1, 2, 1])),
  },
};

export const FourColumns: Story = {
  args: {
    editorConfig: plateBlockRendererConfig,
    value: grid(sized([1, 1, 1, 1]), { gap: 's' }),
  },
};

export const HeadlineAndGreyBackground: Story = {
  args: {
    editorConfig: plateBlockRendererConfig,
    value: grid(sized([2, 1]), { headline: 'Plan your visit', theme: 'grey' }),
  },
};

export const WideGap: Story = {
  args: {
    editorConfig: plateBlockRendererConfig,
    value: grid(sized([1, 1, 1]), { gap: 'l' }),
  },
};

export const StackedWhenNarrow: Story = {
  args: { editorConfig: plateBlockRendererConfig, value: grid(sized([2, 1])) },
  render: (args) => (
    <div className="mx-auto w-[360px]">
      <PlateRenderer {...args} />
    </div>
  ),
};

export const KeptInARowWhenNarrow: Story = {
  args: {
    editorConfig: plateBlockRendererConfig,
    value: grid(sized([1, 1]), { stack: false }),
  },
  render: (args) => (
    <div className="mx-auto w-[360px]">
      <PlateRenderer {...args} />
    </div>
  ),
};

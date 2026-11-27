import type { Meta, StoryObj } from '@storybook/react-vite';

import '../styles/content.css';
import { PlateRenderer, type Value } from '../components/editor';
import plateBlockRendererConfig from '../config/presets/block-renderer';

// The published view of the accordion with the `block-renderer` preset,
// which has no site configuration: what any editor that installs
// `@plone/plate` renders.

const p = (text: string) => ({ type: 'p', children: [{ text }] });

const panel = (
  id: string,
  title: string,
  body: string[],
  { startOpen = false, anchor = '' } = {},
) => ({
  type: 'accordion_panel',
  id,
  startOpen,
  anchor,
  children: [
    { type: 'accordion_panel_title', children: [{ text: title }] },
    { type: 'accordion_panel_content', children: body.map(p) },
  ],
});

const accordion = ({ exclusive = true, theme = 'white' } = {}): Value => [
  p('Everything you need before your visit, in one place.'),
  {
    type: 'accordion',
    id: 'visiting-us',
    exclusive,
    theme,
    children: [
      panel(
        'opening-hours',
        'Opening hours',
        [
          'We are open Monday to Friday, 9:00 to 17:00.',
          'On public holidays the office stays closed.',
        ],
        { startOpen: true, anchor: 'opening-hours' },
      ),
      panel('how-to-find-us', 'How to find us', [
        'Take the tram to Central Square; the entrance is on the left.',
      ]),
      panel('contact', 'Contact', ['Write to us at info@example.com.'], {
        startOpen: true,
      }),
    ],
  },
];

const meta = {
  title: 'Blocks/Accordion/Published view',
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

export const OnePanelAtATime: Story = {
  args: {
    editorConfig: plateBlockRendererConfig,
    value: accordion(),
  },
};

export const SeveralPanelsOpen: Story = {
  args: {
    editorConfig: plateBlockRendererConfig,
    value: accordion({ exclusive: false }),
  },
};

export const GreyBackground: Story = {
  args: {
    editorConfig: plateBlockRendererConfig,
    value: accordion({ theme: 'grey' }),
  },
};

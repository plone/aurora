import type { Meta, StoryObj } from '@storybook/react-vite';

import '../styles/content.css';
import { PlateEditor, type Value } from '../components/editor';
import plateBlockEditorConfig from '../config/presets/block-editor';

// The accordion in the editor with the `block-editor` preset, which has no
// site configuration: what any editor that installs `@plone/plate` gets.
// Type "/" in an empty paragraph to insert another accordion.

const p = (text: string) => ({ type: 'p', children: [{ text }] });

const panel = (id: string, title: string, body: string[]) => ({
  type: 'accordion_panel',
  id,
  startOpen: false,
  anchor: '',
  children: [
    { type: 'accordion_panel_title', children: [{ text: title }] },
    { type: 'accordion_panel_content', children: body.map(p) },
  ],
});

const accordion = (panels: object[]): Value =>
  [
    p('Everything you need before your visit, in one place.'),
    {
      type: 'accordion',
      id: 'visiting-us',
      exclusive: true,
      theme: 'white',
      children: panels,
    },
    p(''),
  ] as Value;

const meta = {
  title: 'Blocks/Accordion/Editor',
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

export const SeveralPanels: Story = {
  args: {
    editorConfig: plateBlockEditorConfig,
    onChange: () => {},
    value: accordion([
      panel('opening-hours', 'Opening hours', [
        'We are open Monday to Friday, 9:00 to 17:00.',
        'On public holidays the office stays closed.',
      ]),
      panel('how-to-find-us', 'How to find us', [
        'Take the tram to Central Square; the entrance is on the left.',
      ]),
      panel('contact', 'Contact', ['']),
    ]),
  },
};

export const NewAccordion: Story = {
  args: {
    editorConfig: plateBlockEditorConfig,
    onChange: () => {},
    value: accordion([panel('new-panel', '', [''])]),
  },
};

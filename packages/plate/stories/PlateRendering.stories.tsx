import { PlateEditor, PlateRenderer, type Value } from '../components/editor';

import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import plateBlockEditorConfig from '../config/presets/block-editor';
import plateBlockRendererConfig from '../config/presets/block-renderer';
import { normalizeLegacyValue } from '../migrations';

const meta = {
  title: 'Basic Rendering',
  component: PlateEditor,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof PlateEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

const PlateStory = (props: React.ComponentProps<typeof PlateEditor>) => {
  const [value, setValue] = useState(props.value);
  // console.log(value);
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="w-[600px] rounded-2xl border border-quanta-azure p-4">
        <PlateEditor
          {...props}
          value={value}
          onChange={(options) => setValue(options.value)}
        />
      </div>
      <div className="w-[600px] rounded-2xl border border-quanta-azure p-4">
        <PlateRenderer
          value={(value as Value) || (props.value as Value)}
          editorConfig={plateBlockRendererConfig}
          variant="none"
        />
      </div>
    </div>
  );
};

export const Default: Story = {
  render: (args: any) => <PlateStory {...args} />,
  args: {
    editorConfig: plateBlockEditorConfig,
    onChange: () => {},
    value: [
      {
        type: 'paragraph',
        children: [{ text: 'A line of text in a paragraph.' }],
      },
    ],
  },
};

// PoC: shadcn/ui Typeset applied to the read-only render (right panel).
// The left panel is the live editor, still using the per-element cva classes,
// so the two panels are a direct before/after comparison of prose styling.
export const Typeset: Story = {
  ...Default,
  args: {
    ...Default.args,
    value: [
      { type: 'h1', children: [{ text: 'Typeset in Aurora' }] },
      {
        type: 'p',
        children: [
          { text: 'A ' },
          { text: 'single owned stylesheet', bold: true },
          {
            text: ' styles rendered content by tag — headings, paragraphs, ',
          },
          { text: 'inline code', code: true },
          { text: ', quotes and more — with a consistent vertical rhythm.' },
        ],
      },
      { type: 'h2', children: [{ text: 'Why it reads better' }] },
      {
        type: 'p',
        children: [
          { text: 'Spacing between blocks comes from one flow variable, and ' },
          {
            children: [{ text: 'links' }],
            type: 'a',
            url: 'https://ui.shadcn.com/docs/typeset',
          },
          { text: ' inherit the theme primary color.' },
        ],
      },
      {
        type: 'blockquote',
        children: [
          {
            text: 'You render markdown and get back plain unstyled HTML; typeset does the rest.',
          },
        ],
      },
      { type: 'h3', children: [{ text: 'Code stays monospaced' }] },
      {
        type: 'code_block',
        children: [
          {
            type: 'code_line',
            children: [{ text: 'const rhythm = "one file, styled by tag";' }],
          },
        ],
      },
    ] as unknown as Value,
  },
};

export const Link: Story = {
  ...Default,
  args: {
    ...Default.args,
    value: [
      {
        children: [
          {
            text: '',
          },
          {
            children: [
              {
                text: 'Plone community website',
              },
            ],
            type: 'a',
            url: 'https://plone.org',
          },
          {
            text: ' ',
          },
        ],
        type: 'p',
      },
    ],
  },
};

// Legacy Slate content is normalized on the server before it reaches the
// editor/renderer (see apps/aurora middleware + @plone/plate/migrations).
// Neither the editor nor the renderer runs legacy `normalizeNode` hooks anymore,
// so this story pre-migrates the legacy value with `normalizeLegacyValue` to
// mirror what the server hands over.
export const LegacyLink: Story = {
  ...Default,
  args: {
    ...Default.args,
    value: normalizeLegacyValue([
      {
        children: [
          {
            text: '',
          },
          {
            children: [
              {
                text: 'Plone community website',
              },
            ],
            type: 'link',
            data: { url: 'https://plone.org' },
          },
          {
            text: ' ',
          },
        ],
        type: 'p',
      },
    ]) as Value,
  },
};

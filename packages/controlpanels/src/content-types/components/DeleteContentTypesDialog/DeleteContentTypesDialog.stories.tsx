import type { Meta, StoryObj } from '@storybook/react-vite';
import { action } from 'storybook/actions';
import { withMockDriver } from '../../stories/decorators';
import { DeleteContentTypesDialog } from './DeleteContentTypesDialog';

const meta = {
  title: 'Control panels/Content types/Delete dialog',
  component: DeleteContentTypesDialog,
  decorators: [withMockDriver],
  args: {
    onClose: action('close'),
    onDeleted: action('deleted'),
  },
} satisfies Meta<typeof DeleteContentTypesDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const OneType: Story = {
  args: {
    types: [{ id: 'Link', title: 'Link', kind: 'dexterity', count: 0 }],
  },
};

/** Types with items can't be deleted, the others can. */
export const SomeWithItems: Story = {
  args: {
    types: [
      { id: 'Link', title: 'Link', kind: 'dexterity', count: 0 },
      { id: 'Document', title: 'Page', kind: 'dexterity', count: 3 },
      { id: 'Image', title: 'Image', kind: 'dexterity', count: 0 },
    ],
  },
};

/** Nothing can be deleted. */
export const OnlyWithItems: Story = {
  args: {
    types: [{ id: 'Document', title: 'Page', kind: 'dexterity', count: 3 }],
  },
};

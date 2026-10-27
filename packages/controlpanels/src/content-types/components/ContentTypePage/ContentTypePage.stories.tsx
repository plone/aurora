import type { Meta, StoryObj } from '@storybook/react-vite';
import { withMockDriver } from '../../stories/decorators';
import { ContentTypePage } from './ContentTypePage';

const meta = {
  title: 'Control panels/Content types/Type page',
  component: ContentTypePage,
  decorators: [
    withMockDriver,
    (Story) => (
      <div className="mx-auto max-w-5xl p-6">
        <Story />
      </div>
    ),
  ],
  parameters: { layout: 'fullscreen' },
  args: { id: 'Event', tab: 'settings' },
} satisfies Meta<typeof ContentTypePage>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Change a setting: the tab gets a dot and the save bar appears. */
export const Settings: Story = {};

/** What plone.restapi supports today: name, description and contents. */
export const BasicBackend: Story = {
  parameters: { driver: { basicBackend: true } },
};

/** A type that can't contain items: no Contents section. */
export const NotFolderish: Story = {
  args: { id: 'Link' },
};

/** Not a Dexterity type: only its settings apply. */
export const Comment: Story = {
  args: { id: 'Discussion Item', tab: 'fields' },
};

/**
 * Every field the edit form shows. Fields from behaviors are locked. Click
 * "Registration required" to edit it in a side sheet, or drag it by its
 * handle. Fieldsets can be reordered too.
 */
export const Fields: Story = {
  args: { tab: 'fields' },
};

/**
 * What plone.restapi supports today: fields can be added, edited, moved and
 * deleted, but fieldsets keep their order, and locked fields show the
 * behavior's name instead of its title.
 */
export const FieldsBasicBackend: Story = {
  args: { tab: 'fields' },
  parameters: {
    driver: {
      basicBackend: true,
      override: {
        listBehaviors: () => Promise.reject(new Error('Not supported')),
      },
    },
  },
};

/** A type with no fields yet. */
export const FieldsOfANewType: Story = {
  args: { id: 'Link', tab: 'fields' },
};

/** A tab that comes in a later phase. */
export const OtherTab: Story = {
  args: { tab: 'behaviors' },
};

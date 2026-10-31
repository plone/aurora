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

/**
 * The behaviors that add fields, in order, and the features. Drag a row, or
 * focus it and press Alt with the up or down arrow; the preview follows.
 * Switch Blocks to its editable layout variant, or add behaviors from the
 * dialog: Dublin Core's parts can't be added twice.
 */
export const Behaviors: Story = {
  args: { tab: 'behaviors' },
};

/**
 * What plone.restapi supports today: no order, no fields per behavior, and
 * no preview from the backend. The tab works out what it can from the
 * type's schema, and estimates the form.
 */
export const BehaviorsBasicBackend: Story = {
  args: { tab: 'behaviors' },
  parameters: {
    driver: { basicBackend: true },
  },
};

/**
 * The type's workflow, with its states and who sees items in each. "Change
 * workflow…" opens the three-step dialog: pick Intranet/Extranet, see the
 * suggested state for the 2 published pages, and pick a less visible one to
 * see the warning.
 */
export const Workflow: Story = {
  args: { id: 'Document', tab: 'workflow' },
};

/** A type without a workflow. */
export const WorkflowNone: Story = {
  args: { id: 'File', tab: 'workflow' },
};

/** A backend that tells the workflow, but can't change it yet. */
export const WorkflowReadOnly: Story = {
  args: { id: 'Document', tab: 'workflow' },
  parameters: {
    driver: { mock: { capabilities: { workflowChange: false } } },
  },
};

/** What plone.restapi supports today: nothing about workflows. */
export const WorkflowBasicBackend: Story = {
  args: { id: 'Document', tab: 'workflow' },
  parameters: {
    driver: { basicBackend: true },
  },
};

/** A tab that comes in a later phase. */
export const OtherTab: Story = {
  args: { tab: 'layout' },
};

import type { Meta, StoryObj } from '@storybook/react-vite';
import { withMockDriver } from '../../stories/decorators';
import { ContentTypesList } from './ContentTypesList';

const meta = {
  title: 'Control panels/Content types/List',
  component: ContentTypesList,
  decorators: [
    withMockDriver,
    (Story) => (
      <div className="mx-auto max-w-5xl p-6">
        <Story />
      </div>
    ),
  ],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof ContentTypesList>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Every capability on: workflow, addability and versioning columns, copying. */
export const Default: Story = {};

/**
 * What plone.restapi supports today: only names, item counts, adding and
 * deleting.
 */
export const BasicBackend: Story = {
  parameters: { driver: { basicBackend: true } },
};

/** A slow backend. */
export const Loading: Story = {
  parameters: { driver: { mock: { latency: 60_000 } } },
};

/** The types can't be loaded. */
export const LoadError: Story = {
  parameters: {
    driver: {
      override: {
        listTypes: () => Promise.reject(new Error('Service unavailable')),
      },
    },
  },
};

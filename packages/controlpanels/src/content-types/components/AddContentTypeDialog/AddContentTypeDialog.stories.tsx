import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { action } from 'storybook/actions';
import { Button } from '@plone/quanta';
import { withMockDriver } from '../../stories/decorators';
import { mockData } from '../../mock/fixtures';
import type { ContentTypeSummary } from '../../types';
import { AddContentTypeDialog } from './AddContentTypeDialog';

const types: ContentTypeSummary[] = mockData.types.map((type) => ({
  id: type.id,
  title: type.title,
  kind: type.kind,
  count: 0,
}));

function Example({ copyFrom }: { copyFrom?: string }) {
  const [isOpen, setOpen] = useState(true);
  return (
    <>
      <Button onPress={() => setOpen(true)}>Add content type</Button>
      <AddContentTypeDialog
        isOpen={isOpen}
        onOpenChange={setOpen}
        types={types}
        copyFrom={copyFrom}
        onCreated={action('created')}
      />
    </>
  );
}

const meta = {
  title: 'Control panels/Content types/Add dialog',
  component: Example,
  decorators: [withMockDriver],
} satisfies Meta<typeof Example>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The short name follows the name until it's edited. */
export const Default: Story = {};

/** Opened from a type's "Copy…" action. */
export const CopyOfAType: Story = {
  args: { copyFrom: 'Event' },
};

/** A backend that can't copy types: no "Start from" choice. */
export const BasicBackend: Story = {
  parameters: { driver: { basicBackend: true } },
};

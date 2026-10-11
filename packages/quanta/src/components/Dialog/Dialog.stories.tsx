import React from 'react';
import { Heading } from 'react-aria-components';
import { Dialog, DialogTrigger } from './Dialog';
import { Button } from '../Button/Button';
import { Modal } from '../Modal/Modal';
import { Popover } from '../Popover/Popover';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  title: 'Quanta/Dialog',
  component: Dialog,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A confirmation in a modal. */
export const Default: Story = {
  render: (args) => (
    <DialogTrigger>
      <Button>Delete…</Button>
      <Modal>
        <Dialog
          {...args}
          role="alertdialog"
          className="flex max-w-md flex-col gap-4"
        >
          {({ close }) => (
            <>
              <Heading slot="title" className="text-lg font-semibold">
                Delete Meeting minutes?
              </Heading>
              <p className="text-sm">
                The type has no items. Its fields, behaviors and layout are
                deleted with it.
              </p>
              <div className="flex justify-end gap-2">
                <Button onPress={close}>Cancel</Button>
                <Button variant="primary" accent onPress={close}>
                  Delete
                </Button>
              </div>
            </>
          )}
        </Dialog>
      </Modal>
    </DialogTrigger>
  ),
};

/** A dialog in a popover, next to its trigger. */
export const InPopover: Story = {
  render: (args) => (
    <DialogTrigger>
      <Button>Help</Button>
      <Popover>
        <Dialog {...args} className="max-w-xs text-sm">
          Locked fields come from behaviors. Turn the behavior off on the
          Behaviors tab to remove them.
        </Dialog>
      </Popover>
    </DialogTrigger>
  ),
};

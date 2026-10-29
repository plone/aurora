import React from 'react';
import { ModalSheet } from './ModalSheet';
import { Button } from '../Button/Button';
import { DialogTrigger, Heading } from '../Dialog/Dialog';
import { TextField } from '../TextField/TextField';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  title: 'Quanta/ModalSheet',
  component: ModalSheet,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ModalSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <DialogTrigger>
      <Button variant="primary" accent>
        Rename…
      </Button>
      <ModalSheet {...args}>
        {({ close }) => (
          <div className="flex flex-col gap-4">
            <Heading slot="title" className="text-lg font-semibold">
              Rename item
            </Heading>
            <TextField autoFocus label="Title" defaultValue="Welcome" />
            <TextField label="Short name" defaultValue="welcome" />
            <div className="flex justify-end gap-2">
              <Button onPress={close}>Cancel</Button>
              <Button variant="primary" accent onPress={close}>
                Save
              </Button>
            </div>
          </div>
        )}
      </ModalSheet>
    </DialogTrigger>
  ),
};

/** On a phone-sized viewport, it opens as a bottom sheet. */
export const Mobile: Story = {
  globals: {
    viewport: { value: 'mobile1' },
  },
  render: Default.render,
};

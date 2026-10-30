import React from 'react';
import { Sheet } from './Sheet';
import { Button } from '../Button/Button';
import { DialogTrigger, Heading } from '../Dialog/Dialog';
import { Switch } from '../Switch/Switch';
import { TextField } from '../TextField/TextField';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  title: 'Quanta/Sheet',
  component: Sheet,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    position: 'right',
  },
} satisfies Meta<typeof Sheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <DialogTrigger>
      <Button variant="primary" accent>
        Edit field…
      </Button>
      <Sheet {...args}>
        {({ close }) => (
          <div className="flex flex-col gap-4">
            <Heading slot="title" className="text-lg font-semibold">
              Edit field
            </Heading>
            <TextField
              autoFocus
              label="Label"
              defaultValue="Registration required"
            />
            <TextField
              label="Help text"
              defaultValue="Visitors must sign up before attending."
            />
            <Switch>Required</Switch>
            <div className="flex justify-end gap-2">
              <Button onPress={close}>Cancel</Button>
              <Button variant="primary" accent onPress={close}>
                Done
              </Button>
            </div>
          </div>
        )}
      </Sheet>
    </DialogTrigger>
  ),
};

export const Left: Story = {
  args: { position: 'left' },
  render: Default.render,
};

export const Bottom: Story = {
  args: { position: 'bottom' },
  render: Default.render,
};

export const LongContent: Story = {
  render: (args) => (
    <DialogTrigger>
      <Button variant="primary" accent>
        Show history…
      </Button>
      <Sheet {...args}>
        <Heading slot="title" className="mb-4 text-lg font-semibold">
          History
        </Heading>
        <ol className="flex flex-col gap-3">
          {Array.from({ length: 40 }, (_, i) => (
            <li key={i}>Version {40 - i}: edited by admin</li>
          ))}
        </ol>
      </Sheet>
    </DialogTrigger>
  ),
};

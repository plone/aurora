import React from 'react';
import { Heading } from 'react-aria-components';
import { Drawer } from './Drawer';
import { Button } from '../Button/Button';
import { Dialog, DialogTrigger } from '../Dialog/Dialog';
import { Switch } from '../Switch/Switch';
import { TextField } from '../TextField/TextField';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  title: 'Quanta/Drawer',
  component: Drawer,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    placement: 'right',
  },
} satisfies Meta<typeof Drawer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <DialogTrigger>
      <Button variant="primary" accent>
        Edit field…
      </Button>
      <Drawer {...args}>
        <Dialog className="flex flex-col gap-4">
          {({ close }) => (
            <>
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
            </>
          )}
        </Dialog>
      </Drawer>
    </DialogTrigger>
  ),
};

export const Left: Story = {
  args: { placement: 'left' },
  render: Default.render,
};

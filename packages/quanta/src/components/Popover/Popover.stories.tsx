import React from 'react';
import type { Meta } from '@storybook/react-vite';
import { Heading } from 'react-aria-components';
import { Button } from '../Button/Button';
import { Dialog, DialogTrigger } from '../Dialog/Dialog';
import { Popover } from '../Popover/Popover';
import { InfoIcon } from '@plone/icons';

const meta: Meta<typeof Popover> = {
  title: 'Quanta/Popover',
  component: Popover,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    showArrow: true,
  },
};

export default meta;

export const Example = (args: any) => (
  <DialogTrigger>
    <Button aria-label="Help">
      <InfoIcon />
    </Button>
    <Popover {...args} className="max-w-[250px]">
      <Dialog>
        <Heading slot="title" className="mb-2 text-lg font-semibold">
          Help
        </Heading>
        <p className="text-sm">
          For help accessing your account, please contact support.
        </p>
      </Dialog>
    </Popover>
  </DialogTrigger>
);

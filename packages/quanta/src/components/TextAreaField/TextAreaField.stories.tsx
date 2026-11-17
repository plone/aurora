import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Form } from 'react-aria-components';
import { Button } from '../Button/Button';
import { TextAreaField } from '../TextAreaField/TextAreaField';

const meta = {
  title: 'Quanta/TextAreaField',
  component: TextAreaField,
  parameters: {
    layout: 'centered',
    backgrounds: { disable: true },
  },
  tags: ['autodocs'],
  args: {
    label: 'Comments',
  },
} satisfies Meta<typeof TextAreaField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    name: 'fieldname',
    label: 'Field label',
    description: 'Optional help text',
    placeholder: 'Type something…',
  },
};

export const Required: Story = {
  args: {
    ...Default.args,
    name: 'required',
    isRequired: true,
  },
};

export const Filled: Story = {
  args: {
    ...Default.args,
    name: 'filled',
    defaultValue: 'Filled with value A',
    isRequired: true,
  },
};

export const Errored: Story = {
  args: {
    ...Default.args,
    name: 'errored',
    defaultValue: 'Filled with value A',
    errorMessage: 'This is the error',
    isInvalid: true,
    isRequired: true,
  },
};

export const Disabled: Story = {
  args: {
    ...Default.args,
    name: 'disabled',
    label: 'Disabled field title',
    isDisabled: true,
  },
};

export const ReadOnly: Story = {
  args: {
    ...Default.args,
    name: 'readonly',
    label: 'Readonly field title',
    defaultValue: 'Filled with value A',
    isReadOnly: true,
  },
};

export const Example = (args: any) => <TextAreaField {...args} />;

export const Validation = (args: any) => (
  <Form className="flex flex-col items-start gap-2">
    <TextAreaField {...args} />
    <Button type="submit" variant="primary" accent>
      Submit
    </Button>
  </Form>
);

Validation.args = {
  isRequired: true,
};

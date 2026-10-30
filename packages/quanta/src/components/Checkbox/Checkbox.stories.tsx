import React from 'react';
import { Checkbox } from './Checkbox';
import {
  CheckboxGroup,
  type CheckboxGroupProps,
} from '../CheckboxGroup/CheckboxGroup';

export default {
  title: 'Quanta/Checkbox',
  component: Checkbox,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {},
  args: {
    isDisabled: false,
    children: 'Checkbox',
  },
};

export const Default = {
  args: {},
};

export const Selected = {
  args: { defaultSelected: true },
};

export const Indeterminate = {
  args: { isIndeterminate: true },
};

export const Disabled = {
  args: { isDisabled: true },
};

export const DisabledSelected = {
  args: { isDisabled: true, defaultSelected: true },
};

export const Invalid = {
  args: { isInvalid: true },
};

export const Group = {
  render: (args: CheckboxGroupProps) => (
    <CheckboxGroup {...args}>
      <Checkbox value="soccer">Soccer</Checkbox>
      <Checkbox value="baseball">Baseball</Checkbox>
      <Checkbox value="basketball">Basketball</Checkbox>
    </CheckboxGroup>
  ),
  args: {
    label: 'Favorite sports',
    description: 'Select all that apply.',
    defaultValue: ['baseball'],
  },
};

export const GroupInvalid = {
  ...Group,
  args: {
    label: 'Favorite sports',
    isInvalid: true,
    errorMessage: 'Select at least one sport.',
  },
};

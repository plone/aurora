import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Collection } from 'react-aria-components';

import {
  QuantaSelect,
  SelectItem,
  SelectSection,
  SelectSectionHeader,
  type SelectItemObject,
  type SelectProps,
} from './Select';

const options = [
  { label: 'Aerospace', value: 'aerospace' },
  { label: 'Mechanical', value: 'mechanical' },
  { label: 'Civil', value: 'civil' },
  { label: 'Biomedical', value: 'biomedical' },
  { label: 'Nuclear', value: 'nuclear' },
  { label: 'Industrial', value: 'industrial' },
  { label: 'Chemical', value: 'chemical' },
  { label: 'Agricultural', value: 'agricultural' },
  { label: 'Electrical', value: 'electrical' },
  { label: 'Telco', value: 'telco' },
];

const groupedOptions = [
  {
    name: 'Fruit',
    children: [
      { id: 'apple', name: 'Apple' },
      { id: 'banana', name: 'Banana' },
      { id: 'orange', name: 'Orange' },
      { id: 'pear', name: 'Pear' },
    ],
  },
  {
    name: 'Vegetable',
    children: [
      { id: 'broccoli', name: 'Broccoli' },
      { id: 'carrots', name: 'Carrots' },
      { id: 'lettuce', name: 'Lettuce' },
      { id: 'spinach', name: 'Spinach' },
    ],
  },
];

const meta: Meta<typeof QuantaSelect> = {
  title: 'Basic/Quanta/Select',
  component: QuantaSelect,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

function ControlledValueStory(args: any) {
  const [value, setValue] = React.useState<string>('telco');

  return (
    <>
      <QuantaSelect {...args} items={options} value={value} onChange={setValue}>
        {(item: SelectItemObject) => (
          <SelectItem id={item.value}>{item.label}</SelectItem>
        )}
      </QuantaSelect>
      <pre style={{ fontSize: 12 }}>
        Current selection: {JSON.stringify(value)}
      </pre>
    </>
  );
}

export const Default: Story = {
  args: {
    name: 'field-default',
    label: 'Field title',
    description: 'Optional help text',
    placeholder: 'Select...',
    children: (
      <>
        <SelectItem id="hello">Hello</SelectItem>
        <SelectItem id="lorem">Lorem Ipsum</SelectItem>
      </>
    ),
  },
};

export const Items: Story = {
  render: (args) => (
    <QuantaSelect<SelectItemObject, 'single'>
      {...(args as SelectProps<SelectItemObject, 'single'>)}
    >
      {(item: SelectItemObject) => (
        <SelectItem id={item.value}>{item.label}</SelectItem>
      )}
    </QuantaSelect>
  ),
  args: {
    name: 'field-items',
    label: 'Field title',
    description: 'Optional help text',
    placeholder: 'Select...',
    items: options,
  },
};

export const Sections: Story = {
  render: (args) => (
    <QuantaSelect<(typeof groupedOptions)[number], 'single'>
      {...(args as SelectProps<(typeof groupedOptions)[number], 'single'>)}
      items={groupedOptions}
    >
      {(section: (typeof groupedOptions)[number]) => (
        <SelectSection id={section.name}>
          <SelectSectionHeader>{section.name}</SelectSectionHeader>
          <Collection items={section.children}>
            {(item: (typeof groupedOptions)[number]['children'][number]) => (
              <SelectItem id={item.id}>{item.name}</SelectItem>
            )}
          </Collection>
        </SelectSection>
      )}
    </QuantaSelect>
  ),
  args: {
    name: 'field-sections',
    label: 'Preferred fruit or vegetable',
    placeholder: 'Select...',
  },
};

export const ControlledValue: Story = {
  render: ControlledValueStory,
  args: {
    name: 'field-controlled',
    label: 'Pick an industry',
    placeholder: 'Select...',
  },
};

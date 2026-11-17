import React from 'react';
import {
  GridListSection,
  useDragAndDrop,
  useListData,
} from 'react-aria-components';
import { GridList, GridListHeader, GridListItem } from './GridList';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  title: 'Quanta/GridList',
  component: GridList,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof GridList>;

export default meta;
type Story = StoryObj<typeof meta>;

const fields = [
  { id: 'title', name: 'Title' },
  { id: 'description', name: 'Summary' },
  { id: 'start', name: 'Event starts' },
  { id: 'end', name: 'Event ends' },
  { id: 'location', name: 'Location' },
];

export const Default: Story = {
  render: () => (
    <GridList aria-label="Fields" items={fields}>
      {(field) => <GridListItem>{field.name}</GridListItem>}
    </GridList>
  ),
};

export const MultipleSelection: Story = {
  render: () => (
    <GridList
      aria-label="Fields"
      items={fields}
      selectionMode="multiple"
      defaultSelectedKeys={['start']}
    >
      {(field) => <GridListItem>{field.name}</GridListItem>}
    </GridList>
  ),
};

function Reorderable() {
  const list = useListData({ initialItems: fields });
  const { dragAndDropHooks } = useDragAndDrop({
    getItems: (keys) =>
      [...keys].map((key) => ({ 'text/plain': list.getItem(key)!.name })),
    onReorder(event) {
      if (event.target.dropPosition === 'before') {
        list.moveBefore(event.target.key, event.keys);
      } else if (event.target.dropPosition === 'after') {
        list.moveAfter(event.target.key, event.keys);
      }
    },
  });
  return (
    <GridList
      aria-label="Fields, reorderable"
      items={list.items}
      dragAndDropHooks={dragAndDropHooks}
    >
      {(field) => <GridListItem>{field.name}</GridListItem>}
    </GridList>
  );
}

/** Drag the handle, or focus a row and use the keyboard to move it. */
export const DragAndDrop: Story = {
  render: () => <Reorderable />,
};

export const WithSections: Story = {
  render: () => (
    <GridList aria-label="Fields">
      <GridListSection id="default">
        <GridListHeader>Default</GridListHeader>
        <GridListItem id="title">Title</GridListItem>
        <GridListItem id="description">Summary</GridListItem>
      </GridListSection>
      <GridListSection id="dates">
        <GridListHeader>Dates</GridListHeader>
        <GridListItem id="start">Event starts</GridListItem>
        <GridListItem id="end">Event ends</GridListItem>
      </GridListSection>
    </GridList>
  ),
};

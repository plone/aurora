import React, { useMemo, useState } from 'react';
import type { Selection, SortDescriptor } from 'react-aria-components';
import { Cell, Column, Row, Table, TableBody, TableHeader } from './Table';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  title: 'Quanta/Table',
  component: Table,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof meta>;

const types = [
  { id: 'Document', title: 'Page', workflow: 'Simple Publication', items: 3 },
  { id: 'Event', title: 'Event', workflow: 'Simple Publication', items: 0 },
  { id: 'File', title: 'File', workflow: 'No workflow', items: 0 },
  { id: 'Image', title: 'Image', workflow: 'No workflow', items: 0 },
  { id: 'Link', title: 'Link', workflow: 'Simple Publication', items: 0 },
  {
    id: 'News Item',
    title: 'News Item',
    workflow: 'Simple Publication',
    items: 0,
  },
];

export const Default: Story = {
  render: () => (
    <Table aria-label="Content types">
      <TableHeader>
        <Column isRowHeader>Type</Column>
        <Column>Workflow</Column>
        <Column width={80}>Items</Column>
      </TableHeader>
      <TableBody items={types}>
        {(type) => (
          <Row>
            <Cell>{type.title}</Cell>
            <Cell>{type.workflow}</Cell>
            <Cell>{type.items}</Cell>
          </Row>
        )}
      </TableBody>
    </Table>
  ),
};

function SelectableAndSortable() {
  const [selected, setSelected] = useState<Selection>(new Set(['Event']));
  const [sort, setSort] = useState<SortDescriptor>({
    column: 'title',
    direction: 'ascending',
  });
  const sorted = useMemo(
    () =>
      [...types].sort((a, b) => {
        const column = sort.column as 'title' | 'items';
        const order =
          a[column] < b[column] ? -1 : a[column] > b[column] ? 1 : 0;
        return sort.direction === 'descending' ? -order : order;
      }),
    [sort],
  );
  return (
    <Table
      aria-label="Content types"
      selectionMode="multiple"
      selectionBehavior="toggle"
      selectedKeys={selected}
      onSelectionChange={setSelected}
      sortDescriptor={sort}
      onSortChange={setSort}
    >
      <TableHeader>
        <Column id="title" isRowHeader allowsSorting>
          Type
        </Column>
        <Column id="workflow">Workflow</Column>
        <Column id="items" width={90} allowsSorting>
          Items
        </Column>
      </TableHeader>
      <TableBody items={sorted}>
        {(type) => (
          <Row>
            <Cell>{type.title}</Cell>
            <Cell>{type.workflow}</Cell>
            <Cell>{type.items}</Cell>
          </Row>
        )}
      </TableBody>
    </Table>
  );
}

export const Selectable: Story = {
  render: () => <SelectableAndSortable />,
};

export const Empty: Story = {
  render: () => (
    <Table aria-label="Content types">
      <TableHeader>
        <Column isRowHeader>Type</Column>
        <Column>Workflow</Column>
      </TableHeader>
      <TableBody
        renderEmptyState={() => (
          <div className="p-4 text-sm text-quanta-pigeon">No types match.</div>
        )}
      >
        {[]}
      </TableBody>
    </Table>
  ),
};

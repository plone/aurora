import * as React from 'react';
import { Tab, TabList, TabPanel, Tabs } from './Tabs';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  title: 'Quanta/Tabs',
  component: Tabs,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="flex gap-8">
      <Tabs {...args}>
        <TabList aria-label="History of Rome">
          <Tab id="FoR">Founding of Rome</Tab>
          <Tab id="MaR">Monarchy and Republic</Tab>
          <Tab id="Emp">Empire</Tab>
        </TabList>
        <TabPanel id="FoR" className="p-3">
          <div className="p-4">
            Arma virumque cano, Troiae qui primus ab oris.
          </div>
        </TabPanel>
        <TabPanel id="MaR" className="p-3">
          <div className="p-4">Senatus Populusque Romanus.</div>
        </TabPanel>
        <TabPanel id="Emp" className="p-3">
          <div className="p-4">Alea jacta est.</div>
        </TabPanel>
      </Tabs>
    </div>
  ),
  args: {
    defaultSelectedKey: 'FoR',
  },
};

export const Vertical: Story = {
  render: (args) => (
    <div className="flex gap-8">
      <Tabs {...args}>
        <TabList aria-label="History of Rome">
          <Tab id="FoR">Founding of Rome</Tab>
          <Tab id="MaR">Monarchy and Republic</Tab>
          <Tab id="Emp">Empire</Tab>
        </TabList>
        <TabPanel id="FoR" className="p-3">
          <div>Arma virumque cano, Troiae qui primus ab oris.</div>
        </TabPanel>
        <TabPanel id="MaR" className="p-3">
          <div>Senatus Populusque Romanus.</div>
        </TabPanel>
        <TabPanel id="Emp" className="p-3">
          <div>Alea jacta est.</div>
        </TabPanel>
      </Tabs>
    </div>
  ),
  args: {
    orientation: 'vertical',
    defaultSelectedKey: 'FoR',
  },
};

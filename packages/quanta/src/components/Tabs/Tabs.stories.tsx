import * as React from 'react';
import { Tab, TabList, TabPanel, Tabs } from './Tabs';
import { TabPanelCarousel } from './TabPanelCarousel';
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

const history = [
  {
    id: 'FoR',
    title: 'Founding of Rome',
    text: 'Arma virumque cano, Troiae qui primus ab oris.',
  },
  {
    id: 'MaR',
    title: 'Monarchy and Republic',
    text: 'Senatus Populusque Romanus.',
  },
  { id: 'Emp', title: 'Empire', text: 'Alea jacta est.' },
];

export const Default: Story = {
  render: (args) => (
    <Tabs {...args} className="w-[520px] max-w-full">
      <TabList aria-label="History of Rome">
        {history.map((item) => (
          <Tab key={item.id} id={item.id}>
            {item.title}
          </Tab>
        ))}
      </TabList>
      {history.map((item) => (
        <TabPanel key={item.id} id={item.id}>
          {item.text}
        </TabPanel>
      ))}
    </Tabs>
  ),
  args: {
    defaultSelectedKey: 'FoR',
  },
};

export const Vertical: Story = {
  render: Default.render,
  args: {
    orientation: 'vertical',
    defaultSelectedKey: 'FoR',
  },
};

export const Disabled: Story = {
  render: Default.render,
  args: {
    defaultSelectedKey: 'FoR',
    disabledKeys: ['Emp'],
  },
};

/**
 * A switch between a few modes of the same page, such as the editor's Blocks
 * and Content. It reads as a setting, so it can sit above a second level of
 * underline tabs without competing with it.
 */
export const Segmented: Story = {
  render: (args) => (
    <Tabs {...args} className="w-[520px] max-w-full">
      <TabList aria-label="Editor mode" variant="segmented">
        <Tab id="blocks">Blocks</Tab>
        <Tab id="content">Content</Tab>
      </TabList>
      <TabPanel id="blocks">The blocks of the page.</TabPanel>
      <TabPanel id="content">The fields of the page.</TabPanel>
    </Tabs>
  ),
  args: {
    defaultSelectedKey: 'content',
  },
};

const fieldsets = [
  {
    id: 'default',
    title: 'Default',
    text: 'Title, summary and the main fields.',
  },
  {
    id: 'categorization',
    title: 'Categorization',
    text: 'Tags, language and related items.',
  },
  { id: 'dates', title: 'Dates', text: 'Publishing and expiration dates.' },
  {
    id: 'ownership',
    title: 'Ownership',
    text: 'Creators, contributors and rights.',
  },
  {
    id: 'settings',
    title: 'Settings',
    text: 'Short name, navigation and discussion.',
  },
];

/**
 * On narrow touch screens, the panels can be swiped: the tab list scrolls,
 * and the indicator follows the finger. Elsewhere, a panel fades in when its
 * tab is selected. Every panel needs `shouldForceMount`.
 */
export const Swipeable: Story = {
  render: (args) => (
    <Tabs {...args} className="w-[360px] max-w-full">
      <TabList aria-label="Fieldsets">
        {fieldsets.map((fieldset) => (
          <Tab key={fieldset.id} id={fieldset.id}>
            {fieldset.title}
          </Tab>
        ))}
      </TabList>
      <TabPanelCarousel>
        {fieldsets.map((fieldset) => (
          <TabPanel key={fieldset.id} id={fieldset.id} shouldForceMount>
            {fieldset.text}
          </TabPanel>
        ))}
      </TabPanelCarousel>
    </Tabs>
  ),
  args: {
    defaultSelectedKey: 'default',
  },
};

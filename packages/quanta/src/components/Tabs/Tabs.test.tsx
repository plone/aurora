import * as React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it } from 'vitest';
import { Tab, TabList, TabPanel, Tabs } from './Tabs';
import { TabPanelCarousel } from './TabPanelCarousel';

beforeAll(() => {
  // jsdom has no Web Animations API, which `SelectionIndicator` reads.
  Element.prototype.getAnimations ??= () => [];
  Element.prototype.scrollTo ??= () => {};
});

const renderTabs = (variant?: 'underline' | 'segmented') =>
  render(
    <Tabs defaultSelectedKey="one" disabledKeys={['three']}>
      <TabList aria-label="Numbers" variant={variant}>
        <Tab id="one">One</Tab>
        <Tab id="two">Two</Tab>
        <Tab id="three">Three</Tab>
      </TabList>
      <TabPanelCarousel>
        <TabPanel id="one" shouldForceMount>
          First
        </TabPanel>
        <TabPanel id="two" shouldForceMount>
          Second
        </TabPanel>
        <TabPanel id="three" shouldForceMount>
          Third
        </TabPanel>
      </TabPanelCarousel>
    </Tabs>,
  );

describe('Tabs', () => {
  it('uses the underline look by default', () => {
    renderTabs();
    expect(screen.getByRole('tablist')).toHaveAttribute(
      'data-variant',
      'underline',
    );
  });

  it('can look like a segmented control', () => {
    renderTabs('segmented');
    expect(screen.getByRole('tablist')).toHaveAttribute(
      'data-variant',
      'segmented',
    );
  });

  it('keeps every panel of a carousel mounted, and only the selected one active', () => {
    renderTabs();
    expect(screen.getByText('Second')).toBeInTheDocument();
    expect(screen.getByText('Second')).toHaveAttribute('inert');
    expect(screen.getByText('First')).not.toHaveAttribute('inert');

    fireEvent.click(screen.getByRole('tab', { name: 'Two' }));
    expect(screen.getByRole('tab', { name: 'Two' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByText('Second')).not.toHaveAttribute('inert');
  });

  it('does not select a disabled tab', () => {
    renderTabs();
    fireEvent.click(screen.getByRole('tab', { name: 'Three' }));
    expect(screen.getByRole('tab', { name: 'Three' })).toHaveAttribute(
      'aria-selected',
      'false',
    );
  });
});

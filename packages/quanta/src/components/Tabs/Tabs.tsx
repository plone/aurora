import React from 'react';
import {
  composeRenderProps,
  Tabs as RACTabs,
  Tab as RACTab,
  TabPanel as RACTabPanel,
  TabPanels as RACTabPanels,
  TabList as RACTabList,
  type TabProps,
  type TabListProps,
  type TabsProps,
  type TabPanelProps,
  type TabPanelsProps,
} from 'react-aria-components';
import { tv } from 'tailwind-variants';
import { focusRing } from '../../utils';

const tabsStyles = tv({
  base: '',
  variants: {
    orientation: {
      vertical: 'flex flex-row',
      horizontal: 'flex flex-col',
    },
  },
});

const tabListStyles = tv({
  base: 'flex gap-1',
  variants: {
    orientation: {
      horizontal: 'flex-row',
      vertical: 'flex-col items-start',
    },
  },
});

export function TabList<T>(props: TabListProps<T>) {
  return (
    <RACTabList
      {...props}
      className={composeRenderProps(props.className, (className, renderProps) =>
        tabListStyles({ ...renderProps, className }),
      )}
    />
  );
}

const tabProps = tv({
  extend: focusRing,
  base: 'flex cursor-default items-center px-4 py-1.5 text-sm font-medium transition',
  variants: {
    isSelected: {
      false: `
        text-gray-600
        hover:bg-gray-200 hover:text-gray-700
        dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-200
        pressed:bg-gray-200 pressed:text-gray-700
        dark:pressed:bg-zinc-800 dark:pressed:text-zinc-200
      `,
      true: `
        bg-gray-800 text-white
        dark:bg-zinc-200 dark:text-black
        forced-colors:bg-[Highlight] forced-colors:text-[HighlightText]
      `,
    },
    isDisabled: {
      true: `
        text-gray-200
        dark:text-zinc-600
        forced-colors:text-[GrayText]
        selected:bg-gray-200 selected:text-gray-300
        dark:selected:bg-zinc-600 dark:selected:text-zinc-500
        forced-colors:selected:bg-[GrayText] forced-colors:selected:text-[HighlightText]
      `,
    },
  },
});

export function Tab(props: TabProps) {
  return (
    <RACTab
      {...props}
      className={composeRenderProps(props.className, (className, renderProps) =>
        tabProps({ ...renderProps, className }),
      )}
    />
  );
}

const tabPanelStyles = tv({
  extend: focusRing,
  base: `
    flex-1 p-4 text-base text-gray-900
    dark:text-zinc-100
  `,
});

export function TabPanel(props: TabPanelProps) {
  return (
    <RACTabPanel
      {...props}
      className={composeRenderProps(props.className, (className, renderProps) =>
        tabPanelStyles({ ...renderProps, className }),
      )}
    />
  );
}

export function Tabs(props: TabsProps) {
  return (
    <RACTabs
      {...props}
      className={composeRenderProps(props.className, (className, renderProps) =>
        tabsStyles({ ...renderProps, className }),
      )}
    />
  );
}

export function TabPanels<T>(props: TabPanelsProps<T>) {
  return <RACTabPanels {...props} />;
}

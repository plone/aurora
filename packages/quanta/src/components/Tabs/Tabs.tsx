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
        text-quanta-iron
        hover:bg-quanta-smoke hover:text-quanta-iron
        dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-200
        pressed:bg-quanta-smoke pressed:text-quanta-iron
        dark:pressed:bg-zinc-800 dark:pressed:text-zinc-200
      `,
      true: `
        bg-quanta-denim text-quanta-air
        dark:bg-zinc-200 dark:text-black
        forced-colors:bg-[Highlight] forced-colors:text-[HighlightText]
      `,
    },
    isDisabled: {
      true: `
        text-quanta-smoke
        dark:text-zinc-600
        forced-colors:text-[GrayText]
        selected:bg-quanta-smoke selected:text-quanta-silver
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
    flex-1 p-4 text-base text-quanta-space
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

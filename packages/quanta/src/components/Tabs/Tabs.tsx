import React, { createContext, useContext } from 'react';
import {
  composeRenderProps,
  SelectionIndicator,
  Tabs as RACTabs,
  Tab as RACTab,
  TabPanel as RACTabPanel,
  TabPanels as RACTabPanels,
  TabList as RACTabList,
  type TabProps,
  type TabListProps as RACTabListProps,
  type TabsProps,
  type TabPanelProps,
  type TabPanelsProps,
} from 'react-aria-components';
import { tv } from 'tailwind-variants';
import { twMerge } from 'tailwind-merge';
import { focusRing } from '../../utils';

/**
 * The look of a tab list: `underline` (the default) for a set of views, such
 * as the fieldsets of a form, and `segmented` for a switch between a few
 * modes of the same page, such as the editor's Blocks and Content.
 */
export type TabListVariant = 'underline' | 'segmented';

const TabListVariantContext = createContext<TabListVariant>('underline');
const TabsOrientationContext = createContext<'horizontal' | 'vertical'>(
  'horizontal',
);

const tabsStyles = tv({
  base: 'group/tabs flex max-w-full',
  variants: {
    orientation: {
      vertical: 'flex-row gap-4',
      horizontal: 'flex-col',
    },
  },
});

export function Tabs(props: TabsProps) {
  return (
    <TabsOrientationContext.Provider value={props.orientation ?? 'horizontal'}>
      <RACTabs
        {...props}
        className={composeRenderProps(
          props.className,
          (className, renderProps) => tabsStyles({ ...renderProps, className }),
        )}
      />
    </TabsOrientationContext.Provider>
  );
}

const tabListStyles = tv({
  base: 'flex max-w-full',
  variants: {
    variant: {
      // The baseline is an inset shadow, so the selected tab's line covers it
      // and the list can still scroll sideways.
      underline: `
        gap-1
        [scrollbar-width:none]
      `,
      segmented: 'inline-flex gap-0.5 rounded-lg bg-quanta-snow p-0.75',
    },
    orientation: {
      horizontal: 'flex-row',
      vertical: 'flex-col',
    },
  },
  compoundVariants: [
    {
      variant: 'underline',
      orientation: 'horizontal',
      className: `overflow-x-auto overflow-y-clip shadow-[inset_0_-1px_0_var(--quanta-smoke)]`,
    },
    {
      variant: 'underline',
      orientation: 'vertical',
      className: `items-stretch shadow-[inset_1px_0_0_var(--quanta-smoke)]`,
    },
  ],
});

export interface TabListProps<T> extends RACTabListProps<T> {
  /** The look of the tabs. Defaults to `underline`. */
  variant?: TabListVariant;
}

export function TabList<T>({
  variant = 'underline',
  ...props
}: TabListProps<T>) {
  return (
    <TabListVariantContext.Provider value={variant}>
      <RACTabList
        {...props}
        data-variant={variant}
        className={composeRenderProps(
          props.className,
          (className, renderProps) =>
            tabListStyles({ ...renderProps, variant, className }),
        )}
      />
    </TabListVariantContext.Provider>
  );
}

const tabStyles = tv({
  extend: focusRing,
  base: `
    group relative flex cursor-default items-center gap-2 text-sm font-medium whitespace-nowrap
    text-quanta-iron -outline-offset-3 transition forced-color-adjust-none
    [-webkit-tap-highlight-color:transparent]
    hover:text-quanta-denim
  `,
  variants: {
    variant: {
      underline: `
        px-3 py-2.5
        selected:text-quanta-sapphire
        forced-colors:selected:text-[Highlight]
      `,
      segmented: `
        isolate justify-center rounded-md px-3.5 py-2
        selected:text-quanta-denim
        forced-colors:selected:text-[HighlightText]
      `,
    },
    isDisabled: {
      true: `
        cursor-not-allowed text-quanta-dolphin
        hover:text-quanta-dolphin
        forced-colors:text-[GrayText]
        selected:text-quanta-dolphin
      `,
    },
  },
});

const indicatorStyles = tv({
  base: `
    quanta-tab-indicator absolute
    motion-safe:transition-[translate,width,height]
  `,
  variants: {
    variant: {
      underline: `
        bg-quanta-sapphire
        group-disabled:bg-quanta-silver
        forced-colors:bg-[Highlight]
      `,
      segmented: `
        inset-0 -z-10 rounded-md bg-quanta-air shadow-[0_1px_2px_rgb(2_19_34/0.14)]
        forced-colors:bg-[Highlight]
      `,
    },
    orientation: {
      horizontal: '',
      vertical: '',
    },
  },
  compoundVariants: [
    {
      variant: 'underline',
      orientation: 'horizontal',
      className: 'bottom-0 left-0 h-0.5 w-full rounded-t-xs',
    },
    {
      variant: 'underline',
      orientation: 'vertical',
      className: 'top-0 left-0 h-full w-0.5 rounded-r-xs',
    },
  ],
});

export function Tab(props: TabProps) {
  const variant = useContext(TabListVariantContext);
  const orientation = useContext(TabsOrientationContext);
  return (
    <RACTab
      {...props}
      className={composeRenderProps(props.className, (className, renderProps) =>
        tabStyles({ ...renderProps, variant, className }),
      )}
    >
      {composeRenderProps(props.children, (children) => (
        <>
          {children}
          <SelectionIndicator
            className={indicatorStyles({ variant, orientation })}
          />
        </>
      ))}
    </RACTab>
  );
}

const tabPanelStyles = tv({
  extend: focusRing,
  base: `
    box-border flex-1 p-4 text-base text-quanta-space transition
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

/**
 * Wraps the tab panels, and animates its height when the selected panel
 * changes. Optional: panels can also be direct children of `Tabs`.
 */
export function TabPanels<T>(props: TabPanelsProps<T>) {
  return (
    <RACTabPanels
      {...props}
      className={twMerge(
        // The panels cross-fade. The styles are here, not on the panels: in a
        // carousel, a panel that is leaving must keep its place.
        `
          relative h-(--tab-panel-height) overflow-clip
          *:data-entering:opacity-0 *:data-exiting:absolute *:data-exiting:top-0
          *:data-exiting:left-0 *:data-exiting:w-full *:data-exiting:opacity-0
          motion-safe:transition-[height]
        `,
        props.className,
      )}
    />
  );
}

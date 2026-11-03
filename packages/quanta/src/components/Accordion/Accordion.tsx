import * as React from 'react';
import { ChevronleftIcon } from '@plone/icons';
import type {
  DisclosureGroupProps,
  ButtonProps,
  DisclosureProps,
  DisclosurePanelProps,
} from 'react-aria-components';
import {
  DisclosureGroup,
  Button,
  Disclosure,
  DisclosurePanel,
  Heading,
} from 'react-aria-components';
import { composeTailwindRenderProps } from '../../utils';

interface AccordionProps extends DisclosureGroupProps {
  ref?: React.RefObject<HTMLDivElement>;
}
const Accordion = ({ children, ref, className, ...props }: AccordionProps) => {
  return (
    <DisclosureGroup
      ref={ref}
      data-slot="disclosure-group"
      {...props}
      className={composeTailwindRenderProps(
        className,
        `
          peer cursor-pointer
          disabled:cursor-not-allowed disabled:opacity-75
        `,
      )}
    >
      {(values) => (
        <div data-slot="disclosure-content">
          {typeof children === 'function' ? children(values) : children}
        </div>
      )}
    </DisclosureGroup>
  );
};

interface AccordionItemProps extends DisclosureProps {
  ref?: React.Ref<HTMLDivElement>;
}
const AccordionItem = ({ className, ref, ...props }: AccordionItemProps) => {
  return (
    <Disclosure
      ref={ref}
      data-slot="disclosure"
      {...props}
      className={composeTailwindRenderProps(
        className,
        `
          peer group/disclosure w-full min-w-60 border-b border-quanta-silver
          disabled:opacity-60
        `,
      )}
    >
      {props.children}
    </Disclosure>
  );
};

interface AccordionItemTriggerProps extends ButtonProps {
  ref?: React.Ref<HTMLButtonElement>;
}
const AccordionItemTrigger = ({
  className,
  ref,
  ...props
}: AccordionItemTriggerProps) => {
  return (
    <Heading>
      <Button
        ref={ref}
        slot="trigger"
        className={composeTailwindRenderProps(
          className,
          `
            group/trigger flex w-full items-center justify-between gap-x-2 py-4.5 text-left
            text-base leading-6 text-quanta-denim
            hover:text-quanta-sapphire
            focus:outline-hidden
            focus-visible:rounded-md focus-visible:outline-3 focus-visible:outline-quanta-cobalt
            disabled:cursor-default disabled:opacity-50
            aria-expanded:text-quanta-sapphire
            **:data-[slot=disclosure-chevron]:size-5 **:data-[slot=icon]:-mx-0.5
            **:data-[slot=icon]:shrink-0 **:data-[slot=icon]:text-quanta-iron
            forced-colors:disabled:text-[GrayText]
            **:[span]:flex **:[span]:items-center **:[span]:gap-x-1
            **:[span]:*:data-[slot=icon]:mr-1
            [&[aria-expanded=true]_[data-slot=disclosure-chevron]]:-rotate-90
          `,
        )}
        {...props}
      >
        {(values) => (
          <>
            {typeof props.children === 'function'
              ? props.children(values)
              : props.children}
            <ChevronleftIcon
              data-slot="disclosure-chevron"
              className="internal-chevron ml-auto size-4 shrink-0 transition duration-300"
            />
          </>
        )}
      </Button>
    </Heading>
  );
};

interface AccordionPanelProps extends DisclosurePanelProps {
  ref?: React.Ref<HTMLDivElement>;
}
const AccordionPanel = ({ className, ref, ...props }: AccordionPanelProps) => {
  return (
    <DisclosurePanel
      ref={ref}
      data-slot="disclosure-panel"
      className={composeTailwindRenderProps(
        className,
        `
          overflow-hidden text-sm text-quanta-iron transition-all
          **:data-[slot=disclosure-group]:border-t
          **:data-[slot=disclosure-group]:**:[.internal-chevron]:hidden
          has-data-[slot=disclosure-group]:**:[button]:px-4
        `,
      )}
      {...props}
    >
      <div
        data-slot="disclosure-panel-content"
        className={`
          pt-0
          not-has-data-[slot=disclosure-group]:group-data-expanded/disclosure:pb-3
          [&:has([data-slot=disclosure-group])_&]:px-11
        `}
      >
        {props.children}
      </div>
    </DisclosurePanel>
  );
};

export type {
  AccordionProps,
  AccordionItemProps,
  AccordionPanelProps,
  AccordionItemTriggerProps,
};
export { Accordion, AccordionItem, AccordionPanel, AccordionItemTrigger };

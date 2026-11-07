import * as React from 'react';

import type { SlateElementProps } from 'platejs/static';

import clsx from 'clsx';
import { ChevronDown } from 'lucide-react';
import { SlateElement } from 'platejs/static';

import {
  getAccordionOptions,
  resolveAccordionTheme,
} from '../editor/plugins/accordion/options';
import { isAccordionPanel } from '../editor/plugins/accordion/transforms';
import type {
  AccordionHeadingLevel,
  TAccordionElement,
  TAccordionPanelElement,
} from '../editor/plugins/accordion/types';
import { BlockInnerContainer } from './block-inner-container';
import { usePanelCollapse } from './use-panel-collapse';

/*
 * The published view of the accordion, following the WAI-ARIA accordion
 * pattern: each panel title is a heading holding a button that opens and
 * closes the panel's content region.
 */

type AccordionViewContextValue = {
  headingLevel: AccordionHeadingLevel;
  keyOf: (panel: TAccordionPanelElement) => string;
  isOpen: (key: string) => boolean;
  setOpen: (key: string, open: boolean) => void;
};

type PanelViewContextValue = {
  contentId: string;
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerId: string;
};

const AccordionViewContext =
  React.createContext<AccordionViewContextValue | null>(null);
const PanelViewContext = React.createContext<PanelViewContextValue | null>(
  null,
);

/*
 * `SlateElement` replaces Slate's `attributes.ref` with its own forwarded ref.
 * When a read-only Plate editor renders these components, Slate needs that
 * ref to map the DOM back to its nodes, or a click inside the element (on a
 * title button, for example) throws, so the accordion's elements pass it on.
 */
const slateRef = (props: SlateElementProps<any>) =>
  (props.attributes as { ref?: React.Ref<any> }).ref;

/** The panels open when the page loads. */
export const getInitiallyOpenPanels = (
  panels: TAccordionPanelElement[],
  keyOf: (panel: TAccordionPanelElement) => string,
  exclusive: boolean,
): string[] => {
  const open = panels.filter((panel) => panel.startOpen).map(keyOf);
  return exclusive ? open.slice(0, 1) : open;
};

const readHash = () => {
  try {
    return decodeURIComponent(window.location.hash.slice(1));
  } catch {
    return window.location.hash.slice(1);
  }
};

export function AccordionElementStatic(
  props: SlateElementProps<TAccordionElement>,
) {
  const { children, editor, element } = props;
  const { headingLevel, themes } = getAccordionOptions(editor);
  const theme = resolveAccordionTheme(themes, element.theme);
  const exclusive = element.exclusive !== false;
  const fallbackId = React.useId();
  const accordionKey = element.id || fallbackId;

  const panels = element.children.filter(isAccordionPanel);
  const keyOf = React.useCallback(
    (panel: TAccordionPanelElement) =>
      panel.id || `${accordionKey}-${element.children.indexOf(panel)}`,
    [accordionKey, element.children],
  );

  const [openKeys, setOpenKeys] = React.useState<string[]>(() =>
    getInitiallyOpenPanels(panels, keyOf, exclusive),
  );

  const setOpen = React.useCallback(
    (key: string, open: boolean) =>
      setOpenKeys((current) => {
        const others = current.filter((item) => item !== key);
        if (!open) return others;
        return exclusive ? [key] : [...others, key];
      }),
    [exclusive],
  );

  // Links to `#<anchor>` open the matching panel. The browser scrolls to it,
  // since the panel carries the anchor as its id.
  const anchors = panels.map((panel) => panel.anchor ?? '').join('\n');
  React.useEffect(() => {
    const openFromHash = () => {
      const hash = readHash();
      if (!hash) return;
      const panel = panels.find((item) => item.anchor && item.anchor === hash);
      if (panel) setOpen(keyOf(panel), true);
    };
    openFromHash();
    window.addEventListener('hashchange', openFromHash);
    return () => window.removeEventListener('hashchange', openFromHash);
    // `anchors` stands for the panels' anchors.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anchors, keyOf, setOpen]);

  const context = React.useMemo<AccordionViewContextValue>(
    () => ({
      headingLevel,
      keyOf,
      isOpen: (key) => openKeys.includes(key),
      setOpen,
    }),
    [headingLevel, keyOf, openKeys, setOpen],
  );

  return (
    <SlateElement
      {...props}
      ref={slateRef(props)}
      attributes={{
        ...props.attributes,
        'data-exclusive': exclusive ? 'true' : 'false',
        'data-theme': theme.id,
      }}
      style={
        {
          ...props.style,
          '--block-accordion-background': theme.color,
          '--theme-color': theme.color,
        } as React.CSSProperties
      }
    >
      <BlockInnerContainer>
        <AccordionViewContext.Provider value={context}>
          {children}
        </AccordionViewContext.Provider>
      </BlockInnerContainer>
    </SlateElement>
  );
}

export function AccordionPanelElementStatic(
  props: SlateElementProps<TAccordionPanelElement>,
) {
  const { children, className, element } = props;
  const accordion = React.useContext(AccordionViewContext);
  const key = accordion?.keyOf(element) ?? element.id;
  const open = accordion ? accordion.isOpen(key) : true;

  const panel = React.useMemo<PanelViewContextValue>(
    () => ({
      contentId: `accordion-${key}-content`,
      open,
      setOpen: (value) => accordion?.setOpen(key, value),
      triggerId: `accordion-${key}-trigger`,
    }),
    [accordion, key, open],
  );

  return (
    <SlateElement
      {...props}
      ref={slateRef(props)}
      className={clsx(className, 'block-accordion__panel')}
      attributes={{
        ...props.attributes,
        'data-open': open ? 'true' : 'false',
        ...(element.anchor ? { id: element.anchor } : {}),
      }}
    >
      <PanelViewContext.Provider value={panel}>
        {children}
      </PanelViewContext.Provider>
    </SlateElement>
  );
}

export function AccordionPanelTitleElementStatic(props: SlateElementProps) {
  const { children, className } = props;
  const accordion = React.useContext(AccordionViewContext);
  const panel = React.useContext(PanelViewContext);
  const level = accordion?.headingLevel ?? 3;

  return (
    <SlateElement
      {...props}
      ref={slateRef(props)}
      as={`h${level}`}
      className={clsx(className, 'block-accordion__heading')}
    >
      <button
        type="button"
        className="block-accordion__trigger"
        id={panel?.triggerId}
        aria-controls={panel?.contentId}
        aria-expanded={panel ? panel.open : true}
        onClick={() => panel?.setOpen(!panel.open)}
      >
        <span className="block-accordion__title">{children}</span>
        <ChevronDown className="block-accordion__icon" aria-hidden="true" />
      </button>
    </SlateElement>
  );
}

export function AccordionPanelContentElementStatic(props: SlateElementProps) {
  const { children, className } = props;
  const panel = React.useContext(PanelViewContext);
  const open = panel ? panel.open : true;
  const contentId = panel?.contentId;
  // The server renders a closed panel `hidden`; from then on, the `hidden`
  // attribute is set by `usePanelCollapse`, so React keeps its first value.
  const [openOnLoad] = React.useState(open);

  usePanelCollapse(
    () => (contentId ? document.getElementById(contentId) : null),
    open,
    () => panel?.setOpen(true),
  );

  return (
    <SlateElement
      {...props}
      ref={slateRef(props)}
      className={clsx(className, 'block-accordion__content')}
      attributes={{
        ...props.attributes,
        ...(panel
          ? {
              id: panel.contentId,
              role: 'region',
              'aria-labelledby': panel.triggerId,
              hidden: !openOnLoad,
            }
          : {}),
      }}
    >
      {children}
    </SlateElement>
  );
}

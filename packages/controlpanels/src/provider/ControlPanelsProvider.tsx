import { createContext, useContext, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import { RouterProvider } from 'react-aria-components';
import { defaultTranslate } from './messages';
import type { Translate } from './messages';

export interface Notification {
  title: string;
  description?: string;
  variant?: 'success' | 'error' | 'info';
}

/** Shows a notification, e.g. a toast. */
export type Notify = (notification: Notification) => void;

/** A navigation the app held back, waiting for the user to decide. */
export interface NavigationBlocker {
  isBlocked: boolean;
  /** Goes on with the navigation. */
  proceed: () => void;
  /** Stays on the page. */
  cancel: () => void;
}

/**
 * A hook that holds back in-app navigation while `when` is true, e.g. React
 * Router's `useBlocker`. Every app passes its own.
 */
export type UseBlocker = (when: boolean) => NavigationBlocker;

export interface ControlPanelsProviderProps {
  children?: ReactNode;
  /**
   * Navigates to a path of the app. Links and other components with an
   * `href` call it instead of reloading the page.
   */
  navigate?: (path: string) => void;
  /** Turns a path into the `href` a link renders, e.g. to add a base path. */
  useHref?: (path: string) => string;
  /** Translates the package's messages. Shows the default text when missing. */
  translate?: Translate;
  /** Shows notifications. Does nothing when missing. */
  notify?: Notify;
  /**
   * Holds back in-app navigation, e.g. while there are unsaved changes.
   * Without it, only reloading and closing the page ask first.
   */
  useBlocker?: UseBlocker;
}

interface ControlPanelsContextValue {
  translate: Translate;
  notify: Notify;
  navigate: (path: string) => void;
  useBlocker: UseBlocker;
}

const noop: Notify = () => {};

const notBlocked: NavigationBlocker = {
  isBlocked: false,
  proceed: () => {},
  cancel: () => {},
};
const neverBlock: UseBlocker = () => notBlocked;

// Without an app router, a full page load is the only way to navigate.
const assignLocation = (path: string) => {
  window.location.assign(path);
};

const ControlPanelsContext = createContext<ControlPanelsContextValue>({
  translate: defaultTranslate,
  notify: noop,
  navigate: assignLocation,
  useBlocker: neverBlock,
});

/**
 * Connects the control panels to the app: its router, its translations and
 * its notifications. Every app renders the screens inside it.
 */
export function ControlPanelsProvider({
  children,
  navigate,
  useHref,
  translate = defaultTranslate,
  notify = noop,
  useBlocker = neverBlock,
}: ControlPanelsProviderProps) {
  const value = useMemo(
    () => ({
      translate,
      notify,
      navigate: navigate ?? assignLocation,
      useBlocker,
    }),
    [translate, notify, navigate, useBlocker],
  );
  const content = (
    <ControlPanelsContext.Provider value={value}>
      {children}
    </ControlPanelsContext.Provider>
  );
  return navigate ? (
    <RouterProvider navigate={navigate} useHref={useHref}>
      {content}
    </RouterProvider>
  ) : (
    content
  );
}

export function useTranslate(): Translate {
  return useContext(ControlPanelsContext).translate;
}

export function useNotify(): Notify {
  return useContext(ControlPanelsContext).notify;
}

/** Navigates to a path of the app, e.g. after creating something. */
export function useNavigate(): (path: string) => void {
  return useContext(ControlPanelsContext).navigate;
}

/**
 * Holds back navigation while `when` is true: in-app navigation through the
 * app's `useBlocker`, and reloading or closing the page through the browser.
 */
export function useNavigationBlocker(when: boolean): NavigationBlocker {
  const useBlocker = useContext(ControlPanelsContext).useBlocker;
  const blocker = useBlocker(when);
  useEffect(() => {
    if (!when) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [when]);
  return blocker;
}

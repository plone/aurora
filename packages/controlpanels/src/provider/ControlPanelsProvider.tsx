import { createContext, useContext, useMemo } from 'react';
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
}

interface ControlPanelsContextValue {
  translate: Translate;
  notify: Notify;
  navigate: (path: string) => void;
}

const noop: Notify = () => {};

// Without an app router, a full page load is the only way to navigate.
const assignLocation = (path: string) => {
  window.location.assign(path);
};

const ControlPanelsContext = createContext<ControlPanelsContextValue>({
  translate: defaultTranslate,
  notify: noop,
  navigate: assignLocation,
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
}: ControlPanelsProviderProps) {
  const value = useMemo(
    () => ({ translate, notify, navigate: navigate ?? assignLocation }),
    [translate, notify, navigate],
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

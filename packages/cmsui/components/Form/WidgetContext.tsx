import { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';

/**
 * Where a form is, for the widgets that need to know: the object browser
 * starts browsing from it, and uploads go to its container.
 *
 * Read the form's values with the hooks of `@plone/helpers`
 * (`useFieldValue`, `useSetFieldValue`); the widget context only tells a
 * widget where it is.
 */
export type WidgetContextValue = {
  /** Whether the form adds a new object, edits one, or edits settings. */
  mode: 'add' | 'edit' | 'settings';
  /**
   * The path the form is about: the edited object, or the container a new
   * object is added to. Paths are app paths, such as `/news/my-page`.
   */
  path: string;
  /** Where new objects go, for example uploaded images. */
  containerPath: string;
};

const parentPath = (path: string) => {
  const segments = path.split('/').filter(Boolean);
  return segments.length <= 1 ? '/' : `/${segments.slice(0, -1).join('/')}`;
};

const DEFAULT_CONTEXT: WidgetContextValue = {
  mode: 'settings',
  path: '/',
  containerPath: '/',
};

const WidgetContext = createContext<WidgetContextValue>(DEFAULT_CONTEXT);

/**
 * Tells the widgets inside it where the form is.
 *
 * - `mode="edit"`: `path` is the edited object; new objects go to its
 *   container.
 * - `mode="add"`: `path` is the container the new object is added to; new
 *   objects go there too.
 * - `mode="settings"`: for forms that are not about content, such as control
 *   panels. Widgets browse from `path`, the site root by default.
 */
export function WidgetContextProvider({
  mode,
  path,
  children,
}: {
  mode: WidgetContextValue['mode'];
  path: string;
  children: ReactNode;
}) {
  const value = useMemo<WidgetContextValue>(() => {
    const normalized = `/${path.replace(/^\/+|\/+$/g, '')}`;
    return {
      mode,
      path: normalized,
      containerPath: mode === 'edit' ? parentPath(normalized) : normalized,
    };
  }, [mode, path]);

  return (
    <WidgetContext.Provider value={value}>{children}</WidgetContext.Provider>
  );
}

/**
 * Where the current form is. Without a provider (for example in Storybook),
 * it is the site root.
 */
export const useWidgetContext = () => useContext(WidgetContext);

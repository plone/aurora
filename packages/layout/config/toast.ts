import { type ReactNode } from 'react';
import { flushSync } from 'react-dom';

import type { ConfigType } from '@plone/registry';
import { UNSTABLE_ToastQueue as RACToastQueue } from 'react-aria-components';

export const DEFAULT_TOAST_TIMEOUT_MS = 6000;

export type ToastItem = {
  title: string;
  description?: string;
  icon?: ReactNode;
  /** Modifier class (e.g. `'success'`, `'info'`, `'error'`); see Toast.css. */
  className?: string;
  /** Hide the auto-dismiss countdown bar. Ignored for sticky toasts. */
  showProgress?: boolean;
};

export type ShowToastOptions = {
  /** Auto-dismiss after `n` ms, or `null` for sticky. */
  timeout?: number | null;
  onClose?: () => void;
};

export type ToastQueue = RACToastQueue<ToastItem>;
export type ToastKey = ReturnType<ToastQueue['add']>;

export const toastQueue = new RACToastQueue<ToastItem>({
  // Sync enter/exit animations with React commits.
  wrapUpdate(fn) {
    if ('startViewTransition' in document) {
      document.startViewTransition(() => {
        flushSync(fn);
      });
    } else {
      fn();
    }
  },
});

export default function install(config: ConfigType) {
  config.registerUtility({
    name: 'queue',
    type: 'toast',
    method: () => toastQueue,
  });
  config.registerUtility({
    name: 'show',
    type: 'toast',
    method: (item: ToastItem, options?: ShowToastOptions): ToastKey => {
      const raw =
        options?.timeout === undefined
          ? DEFAULT_TOAST_TIMEOUT_MS
          : options.timeout;
      // null or <=0 → sticky (no auto-dismiss timer)
      const timeout = raw && raw > 0 ? raw : undefined;
      return toastQueue.add(item, {
        timeout,
        onClose: options?.onClose,
      });
    },
  });
  config.registerUtility({
    name: 'dismiss',
    type: 'toast',
    method: (key: ToastKey) => toastQueue.close(key),
  });
}

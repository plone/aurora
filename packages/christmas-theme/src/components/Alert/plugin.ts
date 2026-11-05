import { createPlatePlugin } from 'platejs/react';
import { createSlatePlugin } from 'platejs';
import { AlertElement } from './AlertElement';
import { AlertElementStatic } from './AlertElementStatic';

export const ALERT_KEY = 'alert';

/**
 * AlertPlugin: Configured for the CMSUI editor.
 */
export const AlertPlugin = createPlatePlugin({
  key: ALERT_KEY,
  node: {
    isElement: true,
    component: AlertElement,
  },
  rules: {
    break: { empty: 'reset' },
  },
});

/**
 * BaseAlertPlugin: Configured for Public UI & SSR rendering.
 */
export const BaseAlertPlugin = createSlatePlugin({
  key: ALERT_KEY,
  node: {
    isElement: true,
    component: AlertElementStatic,
  },
});

import type { SlateEditor } from 'platejs';
import { createPlatePlugin, usePluginOption } from 'platejs/react';

/**
 * Plate's i18n contract follows react-i18next: hosts pass `PlateEditor` a `t`
 * function and the current `language` (react-i18next's `t` and
 * `i18n.language` as is; other i18n machinery, like react-intl, is adapted).
 * Inside Plate, `useTranslation()` returns them in react-i18next's shape.
 */

/**
 * i18next-style options: `defaultValue` is the source text, used whenever the
 * host has no translation for the key; every other entry is an interpolation
 * value for `{{placeholder}}`s.
 */
export type TranslateOptions = {
  defaultValue?: string;
  [value: string]: unknown;
};

/** A subset of i18next's `t`. */
export type TranslateFunction = (
  key: string,
  options?: TranslateOptions,
) => string;

/** A subset of the i18next instance, as returned by `useTranslation()`. */
export type I18n = {
  /** The current language, e.g. `en` or `en-US`, for `Intl` formatting. */
  language: string;
};

export type Translation = {
  t: TranslateFunction;
  i18n: I18n;
};

const PLACEHOLDER = /\{\{\s*(\w+)\s*\}\}/g;

export const fallbackTranslate: TranslateFunction = (key, options) =>
  (options?.defaultValue ?? key).replace(PLACEHOLDER, (match, name) =>
    options?.[name] !== undefined ? String(options[name]) : match,
  );

export const defaultLanguage = 'en';

/**
 * Adapts a react-intl `intl` object. Kept for hosts still passing the legacy
 * `intl` prop (Volto).
 */
export const translationFromIntl = (intl: {
  locale: string;
  formatMessage: (
    message: { id: string; defaultMessage?: string },
    values?: Record<string, any>,
  ) => any;
}): { t: TranslateFunction; language: string } => ({
  t: (key, options) => {
    const { defaultValue, ...values } = options ?? {};

    return String(
      intl.formatMessage(
        {
          id: key,
          // react-intl uses ICU `{placeholder}`s.
          defaultMessage: defaultValue?.replace(PLACEHOLDER, '{$1}'),
        },
        values,
      ),
    );
  },
  language: intl.locale,
});

export const I18nPlugin = createPlatePlugin({
  key: 'i18n',
  options: {
    t: fallbackTranslate as TranslateFunction,
    language: defaultLanguage as string,
  },
});

/**
 * Translation outside of React (transforms, normalizers, utilities). Call it
 * when the text is needed, so it always uses the current language.
 */
export const getTranslation = (editor: SlateEditor): Translation => {
  if (!editor.plugins[I18nPlugin.key]) {
    return { t: fallbackTranslate, i18n: { language: defaultLanguage } };
  }

  return {
    t: editor.getOption(I18nPlugin, 't') ?? fallbackTranslate,
    i18n: {
      language: editor.getOption(I18nPlugin, 'language') ?? defaultLanguage,
    },
  };
};

/**
 * Translation inside components, like react-i18next's `useTranslation()`.
 * Subscribes to the plugin options, so the component re-renders when the host
 * switches language.
 */
export const useTranslation = (): Translation => ({
  t: usePluginOption(I18nPlugin, 't') ?? fallbackTranslate,
  i18n: {
    language: usePluginOption(I18nPlugin, 'language') ?? defaultLanguage,
  },
});

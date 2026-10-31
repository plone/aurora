/**
 * The control panels' i18n contract is the one of `@plone/plate`, which
 * follows react-i18next: apps pass a `t` function, react-i18next's `t` as is,
 * or an adapter for other i18n machinery, like react-intl
 * (`translationFromIntl`). The translations ship in `src/locales`, as
 * i18next's `common` namespace.
 */

/**
 * A translatable message: its key in the catalogs and its English text.
 * Placeholders use i18next's double braces: `Delete {{count}} types`.
 */
export interface Message {
  id: string;
  defaultMessage: string;
}

export type MessageValues = Record<string, string | number>;

/**
 * i18next-style options: `defaultValue` is the source text, used whenever the
 * app has no translation for the key; every other entry is an interpolation
 * value for `{{placeholder}}`s.
 */
export type TranslateOptions = {
  defaultValue?: string;
  [value: string]: unknown;
};

/** A subset of i18next's `t`, which apps pass to `ControlPanelsProvider`. */
export type TranslateFunction = (
  key: string,
  options?: TranslateOptions,
) => string;

/** Turns a message into text in the current language, for the screens. */
export type Translate = (message: Message, values?: MessageValues) => string;

/** Declares a group of messages, keeping their keys typed. */
export function defineMessages<K extends string>(
  messages: Record<K, Message>,
): Record<K, Message> {
  return messages;
}

const PLACEHOLDER = /\{\{\s*(\w+)\s*\}\}/g;

/** Replaces `{{name}}` placeholders with their values. */
export function interpolate(
  template: string,
  values?: Record<string, unknown>,
): string {
  if (!values) return template;
  return template.replace(PLACEHOLDER, (match, name: string) =>
    values[name] !== undefined ? String(values[name]) : match,
  );
}

/** Shows each message's English text. Used when the app passes no `t`. */
export const fallbackTranslate: TranslateFunction = (key, options) =>
  interpolate(options?.defaultValue ?? key, options);

/**
 * The screens' `Translate` on top of an app's `t`. React escapes what it
 * renders, so i18next mustn't escape the values too (`/` would show as
 * `&#x2F;`).
 */
export const toTranslate =
  (t: TranslateFunction): Translate =>
  (message, values) =>
    t(message.id, {
      ...values,
      defaultValue: message.defaultMessage,
      interpolation: { escapeValue: false },
    });

/**
 * Adapts a react-intl `intl` object, e.g. Volto's, to the `t` the control
 * panels take. The catalogs' keys are react-intl message ids.
 */
export const translationFromIntl = (intl: {
  formatMessage: (
    message: { id: string; defaultMessage?: string },
    values?: Record<string, any>,
  ) => any;
}): TranslateFunction => {
  return (key, options) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { defaultValue, interpolation, ...values } = options ?? {};
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
  };
};

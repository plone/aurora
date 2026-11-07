/**
 * A translatable message, in the same shape as react-intl's message
 * descriptors. Placeholders use single braces: `Delete {count} types`.
 */
export interface Message {
  id: string;
  defaultMessage: string;
}

export type MessageValues = Record<string, string | number>;

/** Turns a message into text in the current language. */
export type Translate = (message: Message, values?: MessageValues) => string;

/** Declares a group of messages, keeping their keys typed. */
export function defineMessages<K extends string>(
  messages: Record<K, Message>,
): Record<K, Message> {
  return messages;
}

/** Replaces `{name}` placeholders with their values. */
export function interpolate(template: string, values?: MessageValues): string {
  if (!values) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    Object.hasOwn(values, name) ? String(values[name]) : match,
  );
}

/** Shows each message's default text. Used when no translation is set up. */
export const defaultTranslate: Translate = (message, values) =>
  interpolate(message.defaultMessage, values);

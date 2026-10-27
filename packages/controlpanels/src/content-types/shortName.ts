/**
 * Derives a type's short name from its name: lowercase ASCII letters,
 * digits and underscores, e.g. "Meeting minutes" → "meeting_minutes".
 */
export function toShortName(name: string): string {
  return name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

/** Whether a short name can be used for a new type. */
export function isValidShortName(shortName: string): boolean {
  return /^[a-z][a-z0-9_]*$/.test(shortName);
}

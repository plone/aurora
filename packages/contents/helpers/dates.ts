/**
 * Whether a catalog date of a contents item is set. Plone sends the string
 * `'None'` for an unset date, other backends send `null`, and `new Date(null)`
 * is the epoch, which would read as long expired.
 */
export function isDateSet(value: unknown): value is string {
  return typeof value === 'string' && value !== '' && value !== 'None';
}

/** Whether the item's expiration date is set and in the past. */
export function isExpired(expirationDate: unknown, now = new Date()) {
  return (
    isDateSet(expirationDate) &&
    new Date(expirationDate).getTime() < now.getTime()
  );
}

/** Whether the item's effective date is set and in the future. */
export function isScheduled(effectiveDate: unknown, now = new Date()) {
  return (
    isDateSet(effectiveDate) &&
    new Date(effectiveDate).getTime() > now.getTime()
  );
}

/** Keys whose values never leave the server. */
const SECRET_KEY =
  /pass(word|wd)?$|^pwd$|token|secret|authorization|cookie|api[-_]?key|credential/i;

export const REDACTED = '[redacted]';

/** Returns a copy of `value` with the values of secret-looking keys replaced. */
export function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [
        k,
        SECRET_KEY.test(k) && v !== null && v !== '' ? REDACTED : redact(v),
      ]),
    );
  }
  return value;
}

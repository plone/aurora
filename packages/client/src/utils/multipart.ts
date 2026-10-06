/*
  multipart/form-data request bodies for plone.restapi.

  The JSON payload goes in a part named `data`, and each binary goes in its own
  part, referenced from the JSON field as `{ part: '<part name>' }`.
  Only top-level fields are supported, since plone.restapi resolves `part`
  references only for Dexterity named file/image fields.
*/

export function isBlob(value: unknown): value is Blob {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Blob).size === 'number' &&
    typeof (value as Blob).type === 'string' &&
    typeof (value as Blob).slice === 'function'
  );
}

function isInlineFilePayload(value: unknown): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    !isBlob(value) &&
    'data' in value &&
    ('encoding' in value || 'filename' in value || 'content-type' in value)
  );
}

export function toRequestBody<T extends Record<string, unknown>>(
  data: T,
): T | FormData {
  const entries = Object.entries(data);
  if (!entries.some(([, value]) => isBlob(value))) return data;

  const form = new FormData();
  const json: Record<string, unknown> = {};
  let partIndex = 0;

  for (const [key, value] of entries) {
    if (isBlob(value)) {
      const part = `attachment_${partIndex++}`;
      // Zope treats a part with an empty filename as empty data.
      form.append(part, value, (value as File).name || 'upload');
      json[key] = { part };
    } else if (isInlineFilePayload(value)) {
      // In a multipart request plone.restapi reads `part` from every file field.
      throw new Error(
        `Field "${key}" has an inline data payload, which cannot be mixed with Blob values in a multipart request.`,
      );
    } else {
      json[key] = value;
    }
  }

  // The `data` part needs a filename, otherwise Zope does not parse it as a file.
  form.append(
    'data',
    new Blob([JSON.stringify(json)], { type: 'application/json' }),
    'data.json',
  );

  return form;
}

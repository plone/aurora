import type { BehaviorMetadataMap } from './behaviorMetadata';
import { holdsCustomFields, isCustomField } from './schemaEditing';
import type { BehaviorInfo, TypeSchema } from './types';

/**
 * Pure helpers for the Behaviors tab: what a behavior adds, how behaviors
 * overlap, and changes to a type's ordered list of behaviors.
 */

export interface BehaviorContext {
  /** The behaviors a driver lists. */
  behaviors: BehaviorInfo[];
  /** The type's saved schema, which tells what its saved behaviors add. */
  schema?: TypeSchema;
  /** The behaviors the saved schema was made with. */
  saved?: string[];
  metadata: BehaviorMetadataMap;
}

/** The `behavior` of a schema field, as one of the behavior names. */
export function fieldBehavior(
  behavior: string | undefined,
  metadata: BehaviorMetadataMap,
): string | undefined {
  if (!behavior) return undefined;
  if (metadata[behavior]) return behavior;
  return (
    Object.entries(metadata).find(([, entry]) =>
      entry.aliases?.includes(behavior),
    )?.[0] ?? behavior
  );
}

/**
 * The fields a behavior adds, from the driver when it says, or else from the
 * type's schema. `undefined` when neither knows, e.g. for a behavior the type
 * doesn't have yet.
 */
export function behaviorFields(
  name: string,
  { behaviors, schema, metadata }: BehaviorContext,
): string[] | undefined {
  const info = behaviors.find((behavior) => behavior.name === name);
  if (info?.fieldsets) {
    return info.fieldsets.flatMap((fieldset) => fieldset.fields);
  }
  if (schema) {
    // In the order of the form.
    const fields = schema.fieldsets
      .flatMap((fieldset) => fieldset.fields)
      .filter(
        (field) =>
          fieldBehavior(schema.properties[field]?.behavior, metadata) === name,
      );
    if (fields.length) return fields;
  }
  if (metadata[name]?.addsFields === false) return [];
  return undefined;
}

/**
 * Whether a behavior adds fields to the edit form. Unknown counts as yes, so
 * its position can still be set.
 */
export function addsFields(name: string, context: BehaviorContext): boolean {
  const fields = behaviorFields(name, context);
  if (fields) return fields.length > 0;
  // A saved behavior that adds nothing to the saved schema adds no fields.
  if (
    context.schema &&
    context.saved?.includes(name) &&
    context.metadata[name]?.addsFields !== true
  ) {
    return false;
  }
  return true;
}

/** The enabled behavior that already contains this one. */
export function includedBy(
  name: string,
  enabled: string[],
  metadata: BehaviorMetadataMap,
): string | undefined {
  return enabled.find((other) => metadata[other]?.includes?.includes(name));
}

/** The enabled behaviors this one contains. */
export function includes(
  name: string,
  enabled: string[],
  metadata: BehaviorMetadataMap,
): string[] {
  return (metadata[name]?.includes ?? []).filter((other) =>
    enabled.includes(other),
  );
}

/** The enabled behavior that does the same as this one in another way. */
export function enabledAlternative(
  name: string,
  enabled: string[],
  metadata: BehaviorMetadataMap,
): string | undefined {
  return metadata[name]?.alternatives?.find((other) => enabled.includes(other));
}

/** Replaces a behavior by another one, at the same position. */
export function replaceBehavior(
  enabled: string[],
  from: string,
  to: string,
): string[] {
  return enabled.map((name) => (name === from ? to : name));
}

/** Moves behaviors before or after another one. */
export function moveBehaviors(
  enabled: string[],
  names: string[],
  target: string,
  position: 'before' | 'after',
): string[] {
  const moving = enabled.filter(
    (name) => names.includes(name) && name !== target,
  );
  if (!moving.length || !enabled.includes(target)) return enabled;
  const rest = enabled.filter((name) => !moving.includes(name));
  const index = rest.indexOf(target) + (position === 'after' ? 1 : 0);
  return [...rest.slice(0, index), ...moving, ...rest.slice(index)];
}

/**
 * Moves a behavior up or down among the ones `among` returns true for,
 * skipping the others.
 */
export function shiftBehavior(
  enabled: string[],
  name: string,
  direction: -1 | 1,
  among: (name: string) => boolean = () => true,
): string[] {
  const ordered = enabled.filter(among);
  const target = ordered[ordered.indexOf(name) + direction];
  if (!target) return enabled;
  return moveBehaviors(
    enabled,
    [name],
    target,
    direction < 0 ? 'before' : 'after',
  );
}

export interface FormPreview {
  schema: TypeSchema;
  /** Enabled behaviors whose fields can't be shown until the type is saved. */
  pending: string[];
}

/**
 * An estimate of the edit form with another list of behaviors, for drivers
 * without `previewSchema`: the saved form without the fields of disabled
 * behaviors, and with the fields of new ones at the end of their fieldsets.
 * It doesn't follow the backend's ordering hints.
 */
export function estimateFormPreview(
  enabled: string[],
  context: BehaviorContext,
): FormPreview {
  const { schema, behaviors, metadata } = context;
  const preview: TypeSchema = structuredClone(
    schema ?? {
      title: '',
      type: 'object',
      fieldsets: [{ id: 'default', title: 'Default', fields: [] }],
      properties: {},
      required: [],
    },
  );
  const keep = (field: string) => {
    const entry = preview.properties[field];
    if (!entry?.behavior || isCustomField(entry)) return true;
    return enabled.includes(fieldBehavior(entry.behavior, metadata) ?? '');
  };
  preview.fieldsets = preview.fieldsets.map((fieldset) => ({
    ...fieldset,
    fields: fieldset.fields.filter(keep),
  }));

  const pending: string[] = [];
  const shown = new Set(preview.fieldsets.flatMap((entry) => entry.fields));
  for (const name of enabled) {
    const info = behaviors.find((behavior) => behavior.name === name);
    if (!info?.fieldsets) {
      // Without details, only the fields already in the saved form are known.
      const known = behaviorFields(name, context);
      if (!known?.length && addsFields(name, context)) pending.push(name);
      continue;
    }
    for (const { id, title, fields } of info.fieldsets) {
      let fieldset = preview.fieldsets.find((entry) => entry.id === id);
      if (!fieldset) {
        fieldset = { id, title, fields: [] };
        preview.fieldsets.push(fieldset);
      }
      for (const field of fields) {
        if (shown.has(field)) continue;
        fieldset.fields.push(field);
        shown.add(field);
        preview.properties[field] ??= { title: field, behavior: name };
      }
    }
  }
  // Fieldsets of behaviors go with their fields; the type's own stay.
  preview.fieldsets = preview.fieldsets.filter(
    (fieldset) => fieldset.fields.length > 0 || holdsCustomFields(fieldset),
  );
  return { schema: preview, pending };
}

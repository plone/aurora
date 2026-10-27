export const PROPERTY_FIELDS = [
  'effective',
  'expires',
  'rights',
  'creators',
  'exclude_from_nav',
] as const;

export type PropertyField = (typeof PROPERTY_FIELDS)[number];

export interface PropertyItem {
  effective?: string | null;
  expires?: string | null;
  rights?: string | null;
  creators?: string[] | null;
  exclude_from_nav?: boolean | null;
}

// Unset effective/expires come back as sentinel dates whose year varies by Plone version.
export function cleanSentinelDate(value: unknown): string | null {
  if (typeof value !== 'string' || value === '' || value === 'None')
    return null;
  const year = Number(value.slice(0, 4));
  if (!Number.isFinite(year) || year < 1970 || year > 2400) return null;
  return value;
}

export interface FieldState<T> {
  mixed: boolean;
  value: T | null;
}

export type InitialStates = {
  [K in PropertyField]: FieldState<PropertyItem[K]>;
};

const norm = (v: unknown): string => JSON.stringify(v ?? null);

export function fieldState<T>(
  values: Array<T | null | undefined>,
): FieldState<T> {
  if (values.length === 0) return { mixed: false, value: null };
  const first = norm(values[0]);
  const allSame = values.every((v) => norm(v) === first);
  return { mixed: !allSame, value: allSame ? (values[0] ?? null) : null };
}

export function computeInitialStates(items: PropertyItem[]): InitialStates {
  return {
    effective: fieldState(items.map((i) => i.effective)),
    expires: fieldState(items.map((i) => i.expires)),
    rights: fieldState(items.map((i) => i.rights)),
    creators: fieldState(items.map((i) => i.creators)),
    exclude_from_nav: fieldState(items.map((i) => i.exclude_from_nav)),
  };
}

export interface PropertyForm {
  effective: string | null;
  expires: string | null;
  rights: string;
  creators: string;
  exclude_from_nav: boolean;
}

const instant = (value: string | null | undefined): string => {
  if (!value) return '';
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? value : String(time);
};

const sameStrings = (a: string[], b: string[]): boolean =>
  a.length === b.length && a.every((value, i) => value === b[i]);

// Diff against loaded values rather than tracking change events: the date picker emits a change while normalizing on load.
export function buildPropertiesPatch(
  initial: InitialStates,
  form: PropertyForm,
): Record<string, unknown> {
  const patch: Record<string, unknown> = {};

  if (instant(form.effective) !== instant(initial.effective.value)) {
    patch.effective = form.effective || null;
  }
  if (instant(form.expires) !== instant(initial.expires.value)) {
    patch.expires = form.expires || null;
  }

  const initialRights = initial.rights.value ?? '';
  if (form.rights !== initialRights) {
    patch.rights = form.rights === '' ? null : form.rights;
  }

  const currentCreators = form.creators
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean);
  if (!sameStrings(currentCreators, initial.creators.value ?? [])) {
    patch.creators = currentCreators;
  }

  if (
    Boolean(form.exclude_from_nav) !== Boolean(initial.exclude_from_nav.value)
  ) {
    patch.exclude_from_nav = Boolean(form.exclude_from_nav);
  }

  return patch;
}

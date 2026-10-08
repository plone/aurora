export interface SharingRole {
  id: string;
  title: string;
}

/**
 * A role value is either an editable boolean, or a read-only sentinel:
 * - `'global'`: role granted globally by a site administrator.
 * - `'acquired'`: role inherited from a parent container.
 */
export type SharingRoleValue = boolean | 'global' | 'acquired';

export interface SharingEntry {
  disabled: boolean;
  id: string;
  login: string | null;
  roles: Record<string, SharingRoleValue>;
  title: string;
  type: 'user' | 'group';
}

export interface SharingResponse {
  available_roles: SharingRole[];
  entries: SharingEntry[];
  inherit: boolean;
}

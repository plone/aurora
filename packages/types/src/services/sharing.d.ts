export interface SharingResponse {
  available_roles: {
    id: string;
    title: string;
  }[];
  entries: {
    disabled: boolean;
    id: string;
    login: string | null;
    roles: Record<string, boolean>;
    title: string;
    type: string;
  };
  inherit: boolean;
}

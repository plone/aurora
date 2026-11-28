export interface ControlPanelFieldset {
  id: string;
  title: string;
  fields: string[];
}

export interface ControlPanelSchema {
  fieldsets: ControlPanelFieldset[];
  properties: Record<string, any>;
  required: string[];
}

export interface Controlpanel {
  '@id': string;
  group: string;
  title: string;
  /** Since plone.restapi 10.2.0: the id of the group, like `plone-general`. */
  group_id?: string | null;
  /** Since plone.restapi 10.2.0: the translated description, or empty. */
  description?: string;
  /**
   * Since plone.restapi 10.2.0: the configlet's icon, a Bootstrap Icons name
   * on Plone 6, or empty.
   */
  icon?: string;
  schema?: ControlPanelSchema;
  data?: Record<string, any>;
}

export interface GetControlpanelsResponse extends Array<Controlpanel> {}

export interface GetControlpanelResponse {
  '@id': string;
  data: any;
  group: string;
  schema: any;
  items?: any;
  title: string;
}

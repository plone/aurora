export interface GetSystemResponse {
  '@id': string;
  cmf_version: string;
  debug_mode: string;
  pil_version: string;
  plone_gs_metadata_version_file_system: string;
  plone_gs_metadata_version_installed: string;
  plone_version: string;
  plone_restapi_version?: string;
  'plone.distribution'?: string;
  python_version: string;
  upgrade: boolean;
  zope_version: string;
}

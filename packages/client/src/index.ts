import PloneClient from './client';

export type {
  ExtendedPloneClient,
  PloneClientExtensions,
  PloneClientMethods,
} from './client';
export { apiRequest, getBackendURL } from './api';
export type { ApiRequestParams } from './api';
export type { PloneClientConfig } from './validation/config';
export type { RequestResponse, RequestError } from './restapi/types';

export default PloneClient;

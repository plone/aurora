/**
 * The server-only configuration of the CMS UI.
 */
import type { ConfigType } from '@plone/registry';
import { blocksSchemaContentResource } from '../helpers/blocksSchema.server';

export default function install(config: ConfigType) {
  // `/<path>/@blocks-schema[/<blockId>]`: the blocks offered when editing the
  // content at `<path>`. `/@blocks-schema` is a route, see `config/routes.ts`.
  config.registerUtility({
    type: 'contentResource',
    name: '@blocks-schema',
    method: blocksSchemaContentResource,
  });

  return config;
}

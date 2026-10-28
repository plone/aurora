import type { LoaderFunctionArgs } from 'react-router';
import { blocksSchemaResponse } from '../helpers/blocksSchema.server';

// `/@blocks-schema` and `/@blocks-schema/<blockId>`. With a content path in
// front, `/<path>/@blocks-schema` is answered by the `contentResource`
// utility registered in `config/routes.ts`.
export async function loader({ params, request }: LoaderFunctionArgs) {
  return blocksSchemaResponse({ request, blockId: params.blockId });
}

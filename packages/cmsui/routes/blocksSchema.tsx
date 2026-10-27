import type { LoaderFunctionArgs } from 'react-router';
import { blocksSchemaResponse } from '../helpers/blocksSchema.server';

// `/@blocks-schema` and `/@blocks-schema/<blockId>`.
export async function loader({ params, request }: LoaderFunctionArgs) {
  return blocksSchemaResponse({ request, blockId: params.blockId });
}

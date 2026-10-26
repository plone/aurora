import { jwtDecode } from 'jwt-decode';
// The *.block.md files of the add-ons, collected at build time.
import blocksDocs from '@plone/registry/blocks-docs';
import config from '@plone/registry';
import { flattenToAppURL, isBlockRestricted } from '@plone/helpers';
import { getAuthFromRequest } from '@plone/react-router';
import { getPloneClientClass } from '@plone/aurora/app/middleware.server';
import type { BlockConfigBase, Content, User } from '@plone/types';
import {
  blocksToMarkdown,
  blockToMarkdown,
  buildFullDetail,
  buildSummaryItem,
  DOCUMENT_DOCS_ID,
  getDocumentDocs,
  restrictedFlag,
  wantsMarkdown,
  type BlockDocsFile,
} from './blocksSchema';

type Auth = { token: string; user: User };

type RestrictedContext = {
  properties: Content;
  navRoot?: Content;
  contentType: string;
  user: User;
};

class UnauthorizedError extends Error {}

// The endpoint returns the blocks' docs, which only exist on the server, so
// it needs an authenticated user. The token comes from the session cookie,
// as for server-side rendering, or from an `Authorization: Bearer` header,
// which is read only here, for agents.
async function getRequestToken(request: Request) {
  const [, bearer] =
    request.headers.get('Authorization')?.match(/^Bearer\s+(\S+)\s*$/i) || [];
  return bearer || (await getAuthFromRequest(request));
}

// Validated tokens, with their user, for a minute at most, so that a client
// that calls the list and then several blocks doesn't validate each time.
const TOKEN_CACHE_TTL = 60 * 1000;
const TOKEN_CACHE_SIZE = 500;
const validatedTokens = new Map<string, { user: User; expires: number }>();

export function clearValidatedTokens() {
  validatedTokens.clear();
}

function getClient(token: string) {
  return getPloneClientClass().initialize({
    apiPath: config.settings.apiPath,
    token,
  });
}

// Aurora can't verify the token's signature, only Plone can. So a token is
// valid when Plone returns its user for it, which also works for users
// defined in the Zope root, such as `admin`.
async function authenticate(request: Request): Promise<Auth> {
  const token = await getRequestToken(request);
  if (!token) throw new UnauthorizedError('Authentication is required.');

  const now = Date.now();
  const cached = validatedTokens.get(token);
  if (cached && cached.expires > now) return { token, user: cached.user };
  validatedTokens.delete(token);

  let payload: { sub?: string; exp?: number };
  try {
    payload = jwtDecode(token);
  } catch {
    throw new UnauthorizedError('The token is not valid.');
  }
  const expires = payload.exp ? payload.exp * 1000 : Infinity;
  if (!payload.sub || expires <= now) {
    throw new UnauthorizedError('The token is not valid or has expired.');
  }

  let user: User;
  try {
    ({ data: user } = await getClient(token).getUser({ id: payload.sub }));
  } catch (error: any) {
    if ([401, 403, 404].includes(error?.status)) {
      throw new UnauthorizedError('The token is not valid or has expired.');
    }
    throw error;
  }

  if (validatedTokens.size >= TOKEN_CACHE_SIZE) {
    validatedTokens.delete(validatedTokens.keys().next().value as string);
  }
  validatedTokens.set(token, {
    user,
    expires: Math.min(expires, now + TOKEN_CACHE_TTL),
  });
  return { token, user };
}

// The same context the block chooser has when editing the content at `path`.
// The content is fetched with the caller's token.
async function getContext(
  path: string,
  { token, user }: Auth,
): Promise<RestrictedContext> {
  const { data } = await getClient(token).getContent({
    path,
    expand: ['navroot'],
  });
  const content = flattenToAppURL(data) as Content;

  return {
    properties: content,
    navRoot: (content['@components'] as any)?.navroot?.navroot,
    contentType: content['@type'],
    user,
  };
}

function isRestrictedIn(
  blockConfig: BlockConfigBase,
  context: RestrictedContext,
) {
  try {
    return isBlockRestricted(blockConfig, context);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(
      `[blocks-schema] restricted() for '${blockConfig.id}' threw:`,
      e,
    );
    return true;
  }
}

// Responses need authentication, so they are private. The format depends on
// the Accept header. A context response also depends on the content, so it is
// not reused.
function cacheHeaders(context: boolean): Record<string, string> {
  return {
    'Cache-Control': context
      ? 'private, max-age=0, must-revalidate'
      : 'private, max-age=300',
    Vary: 'Accept, Accept-Language, Authorization, Cookie',
  };
}

function markdownResponse(markdown: string, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'text/markdown; charset=utf-8');
  return new Response(markdown, { ...init, headers });
}

function errorResponse(
  status: number,
  type: string,
  message: string,
  markdown: boolean,
  headers: Record<string, string> = {},
): Response {
  return markdown
    ? markdownResponse(`${message}\n`, { status, headers })
    : Response.json({ error: { type, message } }, { status, headers });
}

const BACKEND_ERRORS: Record<number, string> = {
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
};

/**
 * Answers a `@blocks-schema` request. `/@blocks-schema` describes every
 * registered block, and `/@blocks-schema/<blockId>` one of them. With a
 * content `path` (`/<path>/@blocks-schema`), the list only has the blocks the
 * block chooser offers when editing that content.
 */
export async function blocksSchemaResponse({
  request,
  path = '',
  blockId,
  docsFiles = blocksDocs,
}: {
  request: Request;
  path?: string;
  blockId?: string;
  docsFiles?: BlockDocsFile[];
}): Promise<Response> {
  const blocksConfig = (config.blocks?.blocksConfig ?? {}) as Record<
    string,
    BlockConfigBase
  >;
  const markdown = wantsMarkdown(request);
  const url = new URL(request.url);
  const id = `${url.pathname}${url.search}`;

  let auth: Auth;
  try {
    auth = await authenticate(request);
  } catch (error) {
    if (!(error instanceof UnauthorizedError)) throw error;
    return errorResponse(401, 'Unauthorized', error.message, markdown, {
      'WWW-Authenticate': 'Bearer',
      'Cache-Control': 'no-store',
    });
  }

  let context: RestrictedContext | undefined;
  if (path && path !== '/') {
    try {
      context = await getContext(path, auth);
    } catch (error: any) {
      const type = BACKEND_ERRORS[error?.status];
      if (!type) throw error;
      return errorResponse(
        error.status,
        type,
        `Could not get the content at '${path}'.`,
        markdown,
      );
    }
  }

  const describe = (blockConfig: BlockConfigBase, full: boolean) => {
    const item = full
      ? buildFullDetail(docsFiles, blockConfig)
      : buildSummaryItem(docsFiles, blockConfig);
    const restricted = context
      ? isRestrictedIn(blockConfig, context)
      : restrictedFlag(blockConfig);
    // In a context, the list only has the blocks offered there.
    if (restricted !== undefined && !(context && !blockId)) {
      item.restricted = restricted;
    }
    return item;
  };

  const headers = cacheHeaders(Boolean(context));

  if (blockId) {
    const blockConfig = blocksConfig[blockId];
    if (!blockConfig || blockId === DOCUMENT_DOCS_ID) {
      return errorResponse(
        404,
        'Not Found',
        `Block '${blockId}' is not registered.`,
        markdown,
        { 'Cache-Control': 'no-store' },
      );
    }
    const detail = describe(blockConfig, true);
    if (markdown) {
      return markdownResponse(`${blockToMarkdown(detail)}\n`, { headers });
    }
    return Response.json({ '@id': id, ...detail }, { headers });
  }

  const full = markdown || url.searchParams.get('full') === '1';
  const items = Object.entries(blocksConfig)
    // Entries that aren't blocks, like the page document, are left out.
    .filter(([key, blockConfig]) => key !== DOCUMENT_DOCS_ID && blockConfig?.id)
    .map(([, blockConfig]) => blockConfig)
    .filter((blockConfig) => !context || !isRestrictedIn(blockConfig, context))
    .map((blockConfig) => describe(blockConfig, full));
  const documentDocs = getDocumentDocs(docsFiles);

  if (markdown) {
    return markdownResponse(blocksToMarkdown(items, documentDocs), {
      headers,
    });
  }
  return Response.json(
    {
      '@id': id,
      ...(documentDocs ? { document: documentDocs } : {}),
      items,
      items_total: items.length,
    },
    { headers },
  );
}

/**
 * The `@blocks-schema` resource below a content path, as registered in the
 * `contentResource` utilities: `subpath` is the block ID, if any.
 */
export function blocksSchemaContentResource({
  request,
  path,
  subpath,
}: {
  request: Request;
  path: string;
  subpath?: string;
}) {
  return blocksSchemaResponse({ request, path, blockId: subpath || undefined });
}

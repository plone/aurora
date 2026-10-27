import { jwtDecode } from 'jwt-decode';
// The *.block.md files of the add-ons, collected at build time.
import blocksDocs from '@plone/registry/blocks-docs';
import config from '@plone/registry';
import { getAuthFromRequest } from '@plone/react-router';
import { getPloneClientClass } from '@plone/aurora/app/middleware.server';
import type { BlockConfigBase, User } from '@plone/types';
import {
  blocksToMarkdown,
  blockToMarkdown,
  buildFullDetail,
  buildSummaryItem,
  DOCUMENT_DOCS_ID,
  elementSummary,
  getDocumentDocs,
  getElements,
  restrictedFlag,
  wantsMarkdown,
  type BlockDocsFile,
} from './blocksSchema';

type Auth = { token: string; user: User };

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

// Responses need authentication, so they are private. The format depends on
// the Accept header.
const CACHE_HEADERS: Record<string, string> = {
  'Cache-Control': 'private, max-age=300',
  Vary: 'Accept, Accept-Language, Authorization, Cookie',
};

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

// The URL of the endpoint as the client called it, without the block ID or
// the query string, so that each item can link to its own URL.
function getEndpointURL(request: Request): string {
  const url = new URL(request.url);
  const proto = request.headers.get('x-forwarded-proto')?.split(',')[0].trim();
  const protocol = proto ? `${proto}:` : url.protocol;
  const [pathname] = url.pathname.match(/^.*?\/@blocks-schema(?=\/|$)/) || [
    url.pathname,
  ];
  return `${protocol}//${url.host}${pathname}`;
}

/**
 * Answers a `@blocks-schema` request. `/@blocks-schema` describes every
 * documented element of the page document and every registered block, and
 * `/@blocks-schema/<blockId>` one of them.
 */
export async function blocksSchemaResponse({
  request,
  blockId,
  docsFiles = blocksDocs,
}: {
  request: Request;
  blockId?: string;
  docsFiles?: BlockDocsFile[];
}): Promise<Response> {
  const blocksConfig = (config.blocks?.blocksConfig ?? {}) as Record<
    string,
    BlockConfigBase
  >;
  // The native elements of the page document, like paragraphs or tables.
  const elements = getElements(
    docsFiles,
    (config.blocks?.plateBlocksConfig ?? {}) as Record<string, object>,
  );
  const markdown = wantsMarkdown(request);
  const endpointURL = getEndpointURL(request);
  // Links use the registry key, which is what the detail route looks up.
  const itemURL = (key: string) => `${endpointURL}/${encodeURIComponent(key)}`;

  try {
    await authenticate(request);
  } catch (error) {
    if (!(error instanceof UnauthorizedError)) throw error;
    return errorResponse(401, 'Unauthorized', error.message, markdown, {
      'WWW-Authenticate': 'Bearer',
      'Cache-Control': 'no-store',
    });
  }

  const describe = (
    key: string,
    blockConfig: BlockConfigBase,
    full: boolean,
  ) => {
    const item = full
      ? buildFullDetail(docsFiles, blockConfig, itemURL(key))
      : buildSummaryItem(docsFiles, blockConfig, itemURL(key));
    const restricted = restrictedFlag(blockConfig);
    if (restricted !== undefined) {
      item.restricted = restricted;
    }
    return item;
  };

  if (blockId) {
    const blockConfig = blocksConfig[blockId];
    // A Plone block wins over an element with the same ID.
    const element = !blockConfig
      ? elements.find((item) => item.id === blockId)
      : undefined;
    if (element) {
      if (markdown) {
        return markdownResponse(`${blockToMarkdown(element)}\n`, {
          headers: CACHE_HEADERS,
        });
      }
      return Response.json(
        { '@id': itemURL(blockId), ...element },
        { headers: CACHE_HEADERS },
      );
    }
    if (!blockConfig || blockId === DOCUMENT_DOCS_ID) {
      return errorResponse(
        404,
        'Not Found',
        `Block '${blockId}' is not registered.`,
        markdown,
        { 'Cache-Control': 'no-store' },
      );
    }
    const detail = describe(blockId, blockConfig, true);
    if (markdown) {
      return markdownResponse(`${blockToMarkdown(detail)}\n`, {
        headers: CACHE_HEADERS,
      });
    }
    return Response.json(detail, { headers: CACHE_HEADERS });
  }

  const blocks = Object.entries(blocksConfig)
    // Entries that aren't blocks, like the page document, are left out.
    .filter(([key, blockConfig]) => key !== DOCUMENT_DOCS_ID && blockConfig?.id)
    .map(([key, blockConfig]) => describe(key, blockConfig, false));
  const items = [
    ...elements.map((element) => elementSummary(element, itemURL(element.id))),
    ...blocks,
  ];
  const documentDocs = getDocumentDocs(docsFiles);

  if (markdown) {
    return markdownResponse(blocksToMarkdown(items, documentDocs), {
      headers: CACHE_HEADERS,
    });
  }
  return Response.json(
    {
      '@id': endpointURL,
      ...(documentDocs ? { document: documentDocs } : {}),
      items,
      items_total: items.length,
    },
    { headers: CACHE_HEADERS },
  );
}

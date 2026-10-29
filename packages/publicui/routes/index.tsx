/**
 * layout of @plone/publicui
 */
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useFetcher,
  useLocation,
  useMatches,
  useNavigate,
  type UIMatch,
  type LinksFunction,
  type MetaFunction,
  type LoaderFunctionArgs,
  RouterContextProvider,
} from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  Link,
  RouterProvider as RACRouterProvider,
} from 'react-aria-components';
import { getLocale } from '@plone/aurora/app/i18next.server';
import {
  ploneContentContext,
  ploneClientContext,
  ploneSiteContext,
  ploneUserContext,
} from '@plone/aurora/app/middleware.server';
import { PersonalTools } from '@plone/layout/components/Toolbar/PersonalTools/PersonalTools';
import { MoreMenu } from '@plone/layout/components/Toolbar/MoreMenu/MoreMenu';
import type { RootLoader } from '@plone/aurora/app/root';
import { FolderIcon } from '@plone/icons';
import Pencil from '@plone/icons/svg/pencil.svg?react';
import SlotRenderer from '@plone/layout/slots/SlotRenderer';
import Toolbar from '@plone/layout/components/Toolbar/Toolbar';
import { shouldShowToolbar } from '@plone/layout/helpers';
import { Plug, PluggablesProvider } from '@plone/layout/components/Pluggable';
import clsx from 'clsx';
import config from '@plone/registry';

import styles from '@plone/layout/slots/App/App.module.css';
import stylesheet from '@plone/aurora/.plone/publicui.css?url';
import { ContentTypesMenu } from '../components/Toolbar/ContentTypesMenu';

export const meta: MetaFunction<unknown, { root: RootLoader }> = ({
  matches,
}) => {
  const content = matches.find((match) => match.id === 'root')?.loaderData
    ?.content;
  if (!content) {
    return [];
  }

  return [
    { title: content.title },
    { name: 'description', content: content.description },
    { name: 'generator', content: 'Plone 7 - https://plone.org' },
  ];
};

export const links: LinksFunction = () => [
  { rel: 'stylesheet', href: stylesheet },
  {
    rel: 'icon',
    href: '/favicon.ico',
    type: 'image/x-icon',
    sizes: 'any',
  },
  {
    rel: 'icon',
    href: '/icon.svg',
    type: 'image/svg+xml',
  },
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap',
  },
];

export async function loader({
  context,
}: LoaderFunctionArgs<RouterContextProvider>) {
  const locale = getLocale(context);
  const content = context.get(ploneContentContext);
  const user = context.get(ploneUserContext);
  const multilingual = !!context.get(ploneSiteContext)?.features?.multilingual;
  const canEdit = shouldShowToolbar(content);
  const cli = context.get(ploneClientContext);
  const [workflowResult, typeResult] =
    canEdit && (content['@type'] as string) !== 'Plone Site'
      ? await Promise.all([
          cli.getWorkflow({ path: content['@id'] }).catch(() => null),
          cli.getType({ type: content['@type'] }).catch(() => null),
        ])
      : [null, null];
  const workflow = workflowResult?.data as unknown as
    | {
        state?: { id: string; title: string };
        transitions?: { '@id': string; title: string }[];
      }
    | undefined;
  const layouts = (typeResult?.data.layouts ?? []).filter(
    (layout) => layout in config.views.layoutViews,
  );
  return {
    content,
    moreData: { workflow, layouts },
    multilingual,
    user: user && {
      id: user.id,
      username: user.username,
      fullname: user.fullname,
      email: user.email,
      portrait: (user.portrait as string | null)
        ? `/@portrait/${encodeURIComponent(user.id)}`
        : null,
    },
    cssLayers: config.settings.cssLayers,
    locale,
  };
}

export default function Index() {
  const location = useLocation();
  const { content, locale, user, moreData, multilingual } =
    useLoaderData<typeof loader>();
  const moreFetcher = useFetcher();
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const matches = useMatches() as UIMatch<unknown, { bodyClass: string }>[];
  const routesBodyClasses = matches
    .filter((match) => match.handle?.bodyClass)
    .map((match) => match.handle?.bodyClass);
  const contentLanguage = (content.language as { token?: string } | undefined)
    ?.token;

  const hasContent =
    matches.filter(
      (match) => match.id === 'content' || match.id === 'content-index',
    ).length > 0;

  const showToolbar = shouldShowToolbar(content);

  return (
    <html lang={contentLanguage || locale || 'en'} dir={i18n.dir()}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="mobile-web-app-capable" content="yes" />
        <Meta />
        <Links />
      </head>
      <body
        className={clsx(routesBodyClasses, {
          'with-toolbar': showToolbar,
        })}
      >
        {/* We pre-define here the @layer before tailwind does, adding our own layers in a React 19 managed <link> tag */}
        <link rel="stylesheet" href="/@layers.css" precedence="first" />
        <RACRouterProvider navigate={navigate}>
          <PluggablesProvider>
            {showToolbar && (
              <Plug
                pluggable="toolbar-bottom"
                id="personal-tools"
                // @ts-expect-error Plug's JavaScript declaration infers never[]
                dependencies={[user, content?.['@components']?.actions]}
              >
                <PersonalTools
                  user={user}
                  actions={content?.['@components']?.actions}
                />
              </Plug>
            )}
            {hasContent && (
              <>
                <Plug
                  pluggable="toolbar-top"
                  id="button-edit"
                  // @ts-expect-error this is currently typed as never[]
                  dependencies={[location.pathname]}
                >
                  <Link
                    className="primary"
                    aria-label="Edit"
                    href={`/@@edit${location.pathname.replace(/^\/$/, '')}`}
                  >
                    <Pencil />
                  </Link>
                </Plug>
                <Plug
                  pluggable="toolbar-top"
                  id="button-contents"
                  // @ts-expect-error this is currently typed as never[]
                  dependencies={[location.pathname]}
                >
                  <Link
                    className="secondary"
                    aria-label="Contents"
                    href={`/@@contents${location.pathname.replace(/^\/$/, '')}`}
                  >
                    <FolderIcon />
                  </Link>
                </Plug>
                <Plug
                  pluggable="toolbar-top"
                  id="button-add"
                  // @ts-expect-error this is currently typed as never[]
                  dependencies={[location.pathname]}
                >
                  <ContentTypesMenu content={content} />
                </Plug>
                <Plug
                  pluggable="toolbar-top"
                  id="button-more"
                  dependencies={
                    [
                      content,
                      moreData,
                      multilingual,
                      location.pathname,
                    ] as never[]
                  }
                >
                  <MoreMenu
                    content={content}
                    path={location.pathname}
                    actions={content?.['@components']?.actions}
                    workflow={moreData.workflow}
                    layouts={moreData.layouts}
                    multilingual={multilingual}
                    onChange={(operation, value) =>
                      moreFetcher.submit(
                        { path: location.pathname, operation, value },
                        { method: 'post', action: '/@more-menu' },
                      )
                    }
                  />
                </Plug>
              </>
            )}
            {showToolbar && <Toolbar />}
            <div id="main">
              <div className={clsx(styles.app, 'app-slot')}>
                <header id="header" className="header-slot">
                  <SlotRenderer
                    name="header"
                    content={content}
                    location={location}
                  />
                </header>
                <div className="main-slot">
                  <Outlet />
                </div>
                <footer id="footer">
                  <SlotRenderer
                    name="footer"
                    content={content}
                    location={location}
                  />
                </footer>
              </div>
            </div>
          </PluggablesProvider>
        </RACRouterProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

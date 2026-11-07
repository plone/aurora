import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  data,
  useFetcher,
  useNavigate,
  useLoaderData,
  type LinksFunction,
  type MetaFunction,
  type LoaderFunctionArgs,
  RouterContextProvider,
} from 'react-router';
import { useTranslation } from 'react-i18next';
import { RouterProvider as RACRouterProvider } from 'react-aria-components';
import clsx from 'clsx';
import { getLocale } from '@plone/aurora/app/i18next.server';
import {
  ploneClientContext,
  ploneContentContext,
  ploneSiteContext,
  ploneUserContext,
} from '@plone/aurora/app/middleware.server';
import { type RootLoader } from '@plone/aurora/app/root';
import { Link } from '@plone/quanta';
import { requireAuthCookie } from '@plone/react-router';
import { PluggablesProvider, Plug } from '@plone/layout/components/Pluggable';
import Toast from '@plone/layout/components/Toast/Toast';
import Toolbar from '@plone/layout/components/Toolbar/Toolbar';
import { ContentTypesMenu } from '@plone/layout/components/Toolbar/ContentTypesMenu/ContentTypesMenu';
import { MoreMenu } from '@plone/layout/components/Toolbar/MoreMenu/MoreMenu';
import { PersonalTools } from '@plone/layout/components/Toolbar/PersonalTools/PersonalTools';
import { canViewContents, shouldShowToolbar } from '@plone/layout/helpers';
import { getMoreMenuData } from '@plone/layout/helpers/moreMenu';
import config from '@plone/registry';
import Back from '@plone/icons/svg/arrow-left.svg?react';
import Pencil from '@plone/icons/svg/pencil.svg?react';

// eslint-disable-next-line import/no-unresolved
import stylesheet from '@plone/aurora/.plone/cmsui.css?url';

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
  params,
  request,
}: LoaderFunctionArgs<RouterContextProvider>) {
  await requireAuthCookie(request);
  const content = context.get(ploneContentContext);
  // Like Volto, the view needs the `folderContents` action, which Plone gives
  // to users who can list the contents of the item.
  if (!canViewContents(content)) {
    throw data('Unauthorized', { status: 401 });
  }
  const locale = getLocale(context);
  const path = `/${params['*'] || ''}`;
  const cli = context.get(ploneClientContext);
  const user = context.get(ploneUserContext);
  const multilingual = !!context.get(ploneSiteContext)?.features?.multilingual;
  const moreData = await getMoreMenuData(cli, content);
  return {
    locale,
    content,
    path,
    moreData,
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
  };
}

export default function Index() {
  const { locale, content, path, moreData, multilingual, user } =
    useLoaderData<typeof loader>();
  const { t, i18n } = useTranslation();
  const moreFetcher = useFetcher();
  // The root is `/`, but its views are `/@@edit`, not `/@@edit/`.
  const viewPath = path.replace(/^\/$/, '');
  const navigate = useNavigate();

  const contentLanguage = (content?.language as { token?: string } | undefined)
    ?.token;
  const showToolbar = shouldShowToolbar(content);

  return (
    <html
      lang={contentLanguage || locale || 'en'}
      data-locale={locale}
      dir={i18n.dir()}
    >
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="mobile-web-app-capable" content="yes" />
        <Meta />
        <Links />
      </head>
      <body className="cmsui">
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
            {showToolbar && (
              <Plug
                pluggable="toolbar-top"
                id="button-edit"
                // @ts-expect-error this is currently typed as never[]
                dependencies={[viewPath]}
              >
                <Link
                  className="primary"
                  aria-label={t('layout.toolbar.edit')}
                  href={`/@@edit${viewPath}`}
                >
                  <Pencil />
                </Link>
              </Plug>
            )}
            {showToolbar && <Toolbar />}
            <div
              className={clsx({
                'ml-(--plone-toolbar-width) max-md:ml-0 max-md:pb-[calc(64px+env(safe-area-inset-bottom,0px))]':
                  showToolbar,
              })}
            >
              <Outlet />
            </div>
            <Plug
              pluggable="toolbar-top"
              id="button-back"
              // @ts-expect-error this is currently typed as never[]
              dependencies={[path]}
            >
              <Link
                className="secondary"
                aria-label={t('layout.toolbar.back')}
                href={path}
              >
                <Back />
              </Link>
            </Plug>
            <Plug
              pluggable="toolbar-top"
              id="button-add"
              // @ts-expect-error this is currently typed as never[]
              dependencies={[content, path]}
            >
              <ContentTypesMenu content={content} path={viewPath} />
            </Plug>
            {showToolbar && (
              <Plug
                pluggable="toolbar-top"
                id="button-more"
                dependencies={
                  [content, moreData, multilingual, path] as never[]
                }
              >
                <MoreMenu
                  content={content}
                  path={path}
                  actions={content?.['@components']?.actions}
                  workflow={moreData.workflow}
                  layouts={moreData.layouts}
                  multilingual={multilingual}
                  onChange={(operation, value) =>
                    moreFetcher.submit(
                      { path, operation, value },
                      { method: 'post', action: '/@more-menu' },
                    )
                  }
                />
              </Plug>
            )}
          </PluggablesProvider>
        </RACRouterProvider>
        <Toast
          queue={config.getUtility({ name: 'queue', type: 'toast' }).method()}
        />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

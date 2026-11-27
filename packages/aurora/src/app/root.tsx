import { useEffect, type PropsWithChildren } from 'react';
import {
  isRouteErrorResponse,
  useRouteError,
  useRouteLoaderData,
} from 'react-router';
import { useTranslation } from 'react-i18next';
import type { RootLoaderData } from '@plone/types';

// The client-safe part of the app's root route. Its middleware and loader are
// in `root.server.ts`.

export const handle = {
  // In the handle export, we can add a i18n key with namespaces our route
  // will need to load. This key can be a single string or an array of strings.
  // TIP: In most cases, you should set this to your defaultNS from your i18n config
  // or if you did not set one, set it to the i18next default namespace "translation"
  i18n: 'common',
};

export function Layout({ children }: PropsWithChildren) {
  // React Router doesn't pass the loader data to `Layout`, and it can be
  // undefined in case of an error
  const loaderData = useRouteLoaderData<RootLoaderData>('root');
  const locale = loaderData?.locale || 'en';

  // Sync the i18n instance's language to the locale detected by the loader,
  // this way, when we do something to change the language, this locale will
  // change and i18next will load the correct translation files
  const { i18n } = useTranslation();
  useEffect(() => {
    if (i18n.language !== locale) i18n.changeLanguage(locale);
  }, [locale, i18n]);

  return children;
}

// ToDo: improve error page and error handling
// Inline styles, not Tailwind classes: Tailwind only scans the app and the
// add-ons, not this package, and a public theme may not use Tailwind at all.
export function ErrorBoundary() {
  // React Router passes the error as a prop only to an `ErrorBoundary` that is
  // declared in the route file. The app's `root.tsx` re-exports this one, so
  // read the error from the route instead.
  const error = useRouteError();
  let message = 'Oops!';
  let details = 'An unexpected error occurred.';
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    switch (error.status) {
      case 404:
        message = '404';
        details = 'The requested page could not be found.';
        break;
      case 401:
        message = '401';
        details = 'You are not authorized to view this page.';
        break;
      case 500:
        message = '500';
        details =
          'The server encountered an internal error. Did you start the backend?';
        break;
      default:
        message = 'Error ' + error.status;
        details = error.statusText || details;
        break;
    }
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body>
        <main
          style={{
            maxWidth: '80rem',
            marginInline: 'auto',
            padding: '4rem 1rem 1rem',
          }}
        >
          <h1>{message}</h1>
          <p>{details}</p>
          {stack && (
            <pre style={{ width: '100%', overflowX: 'auto', padding: '1rem' }}>
              <code>{stack}</code>
            </pre>
          )}
        </main>
      </body>
    </html>
  );
}

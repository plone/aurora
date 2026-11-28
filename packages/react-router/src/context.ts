/**
 * The React Router contexts that the app's middleware sets for each request,
 * and that loaders and actions read with `context.get()`.
 *
 * React Router finds a value by the identity of its context object, so the app
 * and every add-on must import the same objects. They live in this package,
 * not in the app, so add-ons can import them without depending on the app.
 *
 * This module has no Node.js imports, so route modules can import it.
 */
import { createContext } from 'react-router';
import type PloneClient from '@plone/client';
import type { Content, GetSiteResponse, User } from '@plone/types';

/** The Plone client for the current request, with the user's credentials. */
export const ploneClientContext = createContext<PloneClient>();

/** The content at the current path, as the root middleware fetched it. */
export const ploneContentContext = createContext<Content>();

/** The `@site` data of the site. */
export const ploneSiteContext = createContext<GetSiteResponse>();

/** The logged-in user, or `null` for an anonymous visitor. */
export const ploneUserContext = createContext<User | null>(null);

/** Whether the response has to clear the authentication cookie. */
export const ploneClearAuthCookieContext = createContext<boolean>(false);

/** The interface language that the app negotiated for the request. */
export const ploneLocaleContext = createContext<string>();

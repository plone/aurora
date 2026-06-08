---
myst:
  html_meta:
    "description": "Plone Aurora vs. Plone Volto: key differences"
    "property=og:description": "Plone Aurora vs. Plone Volto: key differences"
    "property=og:title": "Plone Aurora vs. Plone Volto: key differences"
    "keywords": "Plone Aurora, Plone Volto, differences, comparison"
---

# Plone Aurora vs Plone Volto: key differences

This guide highlights the main conceptual and design differences between Plone Aurora and Plone Volto.
It helps Plone Volto developers move to Plone Aurora by explaining the design decisions behind Plone Aurora and the alternative tooling it offers.

## No Redux

One of the most visible differences between Plone Aurora and Plone Volto is that Plone Aurora ships without Redux.
Plone Volto relies on Redux to mediate almost every interaction with the backend; actions and reducers orchestrate data fetching and client state.
Plone Aurora instead leans on React Router's framework loaders and actions to retrieve data and coordinate state.
The result is a smaller surface area, fewer custom abstractions, and a code base that is easier to trace because it stays within well-known React patterns.

When Plone Aurora needs shared state outside of loaders and actions, it turns to Jotai, a lightweight state management library for React.


## Modern React SSR

Plone Aurora embraces modern React Server-Side Rendering (SSR) techniques, leveraging the latest advances in the React ecosystem.
This leads to smaller bundles, faster initial renders, improved SEO, and a smoother overall user experience.

Plone Volto, by contrast, keeps a traditional isomorphic setup powered by Razzle.
That approach carries extra build complexity, requires the client to know how to reach the Plone API directly, and tends to ship larger bundles that slow down the first paint.
After the initial HTML render, the Plone Volto client keeps reaching the backend via direct API calls.

Plone Aurora relies on React Router's built-in SSR pipeline, keeping server and client responsibilities aligned with modern React guidance.
The server sends ready-to-hydrate HTML, while framework loaders and actions own subsequent data access.
Because this work happens on the server, the browser does not need to know where the backend lives.

React Router 7 framework also has the concept of middlewares, which allow Plone Aurora to run code before or after every request.
This is useful for tasks like authentication, logging, and error handling.
It replaces Volto's custom Express server configuration and middleware stack.

## No backend API exposed

Plone Aurora keeps the backend API hidden behind the application server.
React Router loaders and actions own the data layer, so UI code does not fetch the API directly.
Components interact with server-rendered routes and never have to know how to authenticate or where the backend lives.
Under the hood, Plone Aurora uses `@plone/client` to talk to Plone, providing a clean abstraction around the API.

## TypeScript-first

Plone Aurora is written in TypeScript from the start, ensuring type safety and a consistent developer experience.
Types improve confidence during refactors, make contracts explicit, and encourage shared patterns across the code base.
Plone Volto supports TypeScript, but much of its core remains JavaScript.

## Styling

Plone Aurora uses standards-based CSS for styling.
Modern CSS has evolved quickly, and features like custom properties cover many use cases that previously required preprocessors.
Although Vite can compile SASS, LESS, and other syntaxes, Plone Aurora favors plain CSS to keep the pipeline simple.

## Tailwind CSS

Plone Aurora ships with optional Tailwind CSS integration.
Plone Aurora {term}`CMSUI` uses Tailwind to deliver a cohesive design system out of the box.
Add-ons and projects can opt in to Tailwind, but it is never mandatory.
The default theme `@plone/agave` is built with Tailwind, and you are free to replace it with plain CSS or any other approach.

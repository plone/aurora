import { useEffect, useState } from 'react';
import {
  ScrollRestoration as RouterScrollRestoration,
  UNSAFE_useScrollRestoration as useScrollRestoration,
  type ScrollRestorationProps,
} from 'react-router';

// Whether the app has hydrated. The first `ScrollRestoration` sets it after
// hydration. It stays `false` on the server, where effects don't run.
let hydrated = false;

function ClientScrollRestoration({
  getKey,
  storageKey,
}: Pick<ScrollRestorationProps, 'getKey' | 'storageKey'>) {
  useScrollRestoration({ getKey, storageKey });
  return null;
}

/**
 * React Router's `ScrollRestoration`, for a route that renders the whole
 * document, as the public UI, the CMS UI and the contents routes do.
 *
 * Navigating between those routes mounts a new document on the client.
 * React Router's `ScrollRestoration` then renders its inline `<script>` again,
 * which never runs on the client, and React warns about it. This component
 * renders React Router's one on the server and during hydration, so the
 * script restores the scroll position of a document request. Mounted after
 * hydration, it only saves and restores the scroll positions, without the
 * script.
 */
export function ScrollRestoration(props: ScrollRestorationProps) {
  const [mountedAfterHydration] = useState(() => hydrated);

  useEffect(() => {
    hydrated = true;
  }, []);

  if (mountedAfterHydration) {
    return (
      <ClientScrollRestoration
        getKey={props.getKey}
        storageKey={props.storageKey}
      />
    );
  }
  return <RouterScrollRestoration {...props} />;
}

export default ScrollRestoration;

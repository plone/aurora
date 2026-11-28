import type { BufferedEvent } from '../events';

/**
 * Server events kept for a panel that connects later: the first request of a
 * page load is handled before the browser connects to the event bus. It lives
 * on `globalThis` because the Vite plugin (which answers the panel) and the
 * SSR modules (which record events) are loaded separately.
 */
const KEY = '__ploneDevtoolsReplay';
export const REPLAY_MAX = 500;

function buffer(): BufferedEvent[] {
  const g = globalThis as unknown as Record<
    string,
    BufferedEvent[] | undefined
  >;
  return (g[KEY] ??= []);
}

export function record(event: BufferedEvent) {
  const buf = buffer();
  buf.push(event);
  if (buf.length > REPLAY_MAX) buf.splice(0, buf.length - REPLAY_MAX);
}

export function recorded(): BufferedEvent[] {
  return [...buffer()];
}

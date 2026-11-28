import { AsyncLocalStorage } from 'node:async_hooks';
import {
  createEventClient,
  type BackendCall,
  type BufferedEvent,
  type Timing,
} from '../events';
import { record } from './buffer';

/** The request (and route handler) the current async work belongs to. */
export type RequestStore = { requestId: string; routeId?: string };

/**
 * Shared on `globalThis`: Vite evaluates SSR modules again after a change,
 * while `diagnostics_channel` subscribers live as long as the process.
 */
type Shared = {
  __ploneDevtoolsAls?: AsyncLocalStorage<RequestStore>;
  __ploneDevtoolsClient?: ReturnType<typeof createEventClient>;
};
const shared = globalThis as unknown as Shared;

export const als = (shared.__ploneDevtoolsAls ??=
  new AsyncLocalStorage<RequestStore>());

const client = () => (shared.__ploneDevtoolsClient ??= createEventClient());

/** Sends an event to the panel and keeps it for panels that connect later. */
export function emit(type: 'timing', payload: Timing): void;
export function emit(type: 'backend-call', payload: BackendCall): void;
export function emit(
  type: BufferedEvent['type'],
  payload: Timing | BackendCall,
) {
  record({ type, payload } as BufferedEvent);
  client().emit(type, payload as never);
}

/** Epoch milliseconds with sub-millisecond precision. */
export const now = () => performance.timeOrigin + performance.now();

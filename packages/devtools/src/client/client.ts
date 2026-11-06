import { createEventClient } from '../events';

/** The browser's event client, shared by the instrumentation and the panel. */
export const client = createEventClient();

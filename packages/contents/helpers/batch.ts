import { HandleCatchedError } from './Errors';

export interface BatchResult<T> {
  ok: T[];
  errors: Array<T & { __error: unknown }>;
}

// Runs the same mutation over every item and reports per-item success and
// failure, so one bad item never aborts the rest of the selection.
export async function settleItems<T extends object>(
  items: T[],
  run: (item: T) => Promise<unknown>,
  errorLabel: string,
): Promise<BatchResult<T>> {
  const ok: T[] = [];
  const errors: BatchResult<T>['errors'] = [];
  let responses: PromiseSettledResult<unknown>[] = [];

  try {
    responses = await Promise.allSettled(items.map(run));
  } catch (e) {
    HandleCatchedError(e, errorLabel);
  }

  responses.forEach((response, i) => {
    if (response.status === 'fulfilled') {
      ok.push(items[i]);
    } else {
      errors.push({ ...items[i], __error: response.reason });
    }
  });

  return { ok, errors };
}

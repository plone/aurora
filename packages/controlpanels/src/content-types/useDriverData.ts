import { useCallback, useEffect, useRef, useState } from 'react';

export interface DriverData<T> {
  data: T | undefined;
  error: Error | undefined;
  isLoading: boolean;
  /** Loads the data again, keeping the current data while it loads. */
  reload: () => Promise<void>;
  /** Replaces the data locally, e.g. after an optimistic change. */
  setData: (update: (data: T | undefined) => T | undefined) => void;
}

/**
 * Loads data from a driver when the component mounts, and again on `reload`.
 * `load` should be stable (wrap it in `useCallback` when it closes over
 * props). The screens use this instead of a data library, so they run in any
 * app.
 */
export function useDriverData<T>(load: () => Promise<T>): DriverData<T> {
  const [data, setState] = useState<T>();
  const [error, setError] = useState<Error>();
  const [isLoading, setIsLoading] = useState(true);
  // Counts requests, so an answer that arrives late is ignored.
  const requests = useRef({ count: 0 });

  const reload = useCallback(async () => {
    const current = ++requests.current.count;
    setIsLoading(true);
    try {
      const result = await load();
      if (current !== requests.current.count) return;
      setState(result);
      setError(undefined);
    } catch (reason) {
      if (current !== requests.current.count) return;
      setError(reason instanceof Error ? reason : new Error(String(reason)));
    } finally {
      if (current === requests.current.count) setIsLoading(false);
    }
  }, [load]);

  useEffect(() => {
    const counter = requests.current;
    void reload();
    return () => {
      // Ignore answers that arrive after unmounting.
      counter.count++;
    };
  }, [reload]);

  const setData = useCallback(
    (update: (data: T | undefined) => T | undefined) => setState(update),
    [],
  );

  return { data, error, isLoading, reload, setData };
}

import { DependencyList, useCallback, useEffect, useRef, useState } from 'react';

type UseAsyncOptions = {
  immediate?: boolean;
};

function useAsync<T>(fn: () => Promise<T>, deps: DependencyList = [], options: UseAsyncOptions = {}) {
  const immediate = options.immediate ?? true;
  const previousDepsRef = useRef<DependencyList | null>(null);
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(Boolean(immediate));
  const [error, setError] = useState<unknown>(null);

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fn();
      setData(response);
      return response;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fn]);

  useEffect(() => {
    if (!immediate) {
      return;
    }

    const previousDeps = previousDepsRef.current;
    const depsChanged =
      previousDeps === null ||
      previousDeps.length !== deps.length ||
      previousDeps.some((value, index) => !Object.is(value, deps[index]));

    if (!depsChanged) {
      return;
    }

    previousDepsRef.current = deps;
    void run().catch(() => undefined);
  }, [deps, immediate, run]);

  return { data, loading, error, run, setData };
}

export default useAsync;

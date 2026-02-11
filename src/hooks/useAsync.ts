import { DependencyList, useCallback, useEffect, useState } from 'react';

type UseAsyncOptions = {
  immediate?: boolean;
};

function useAsync<T>(fn: () => Promise<T>, deps: DependencyList = [], options: UseAsyncOptions = {}) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(Boolean(options.immediate ?? true));
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
    if (options.immediate ?? true) {
      void run();
    }
  }, [options.immediate, run, deps]);

  return { data, loading, error, run, setData };
}

export default useAsync;

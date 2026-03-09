import { useCallback, useEffect, useMemo, useState } from 'react';
import type { EslStatusSnapshot, EslStatusSummary } from '../types/esl';
import { getStatusSummary, queryEslStatus } from '../services/esl/statusService';

type UseEslStatusOptions = {
  page?: number;
  size?: number;
  pollingIntervalMs?: number;
  enabled?: boolean;
};

export function useEslStatus(options: UseEslStatusOptions = {}) {
  const page = options.page ?? 1;
  const size = options.size ?? 100;
  const pollingIntervalMs = options.pollingIntervalMs ?? 60000;
  const enabled = options.enabled ?? true;

  const [snapshots, setSnapshots] = useState<EslStatusSnapshot[]>([]);
  const [summary, setSummary] = useState<EslStatusSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    // Hook central de monitoramento: status paginado + resumo agregado.
    if (!enabled) {
      return;
    }

    setError(null);

    try {
      const [statusResult, summaryResult] = await Promise.all([queryEslStatus(page, size), getStatusSummary()]);

      if (!statusResult.success) {
        throw new Error(statusResult.error_msg || 'Falha ao consultar status ESL.');
      }

      setSnapshots(statusResult.data ?? []);
      setSummary(summaryResult.data ?? null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao consultar status ESL.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [enabled, page, size]);

  useEffect(() => {
    void load();

    if (!enabled) {
      return;
    }

    const timer = window.setInterval(() => {
      void load();
    }, pollingIntervalMs);

    return () => {
      window.clearInterval(timer);
    };
  }, [enabled, load, pollingIntervalMs]);

  return useMemo(
    () => ({
      snapshots,
      summary,
      loading,
      error,
      refresh: load
    }),
    [snapshots, summary, loading, error, load]
  );
}

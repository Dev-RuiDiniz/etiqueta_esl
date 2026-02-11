import { useCallback, useEffect, useMemo, useState } from 'react';
import HistoryFiltersBar from '../components/history/HistoryFiltersBar';
import HistoryTable from '../components/history/HistoryTable';
import { useNavigate } from '../lib/router';
import { getHistory } from '../services/historyService';
import type { HistoryFiltersValues, HistoryItem } from '../types/history';

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getDefaultFilters(): HistoryFiltersValues {
  const endDate = new Date();
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - 7);

  return {
    startDate: toDateInputValue(startDate),
    endDate: toDateInputValue(endDate),
    sku: '',
    tagId: '',
    status: 'ALL'
  };
}

function Historico() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [filters, setFilters] = useState<HistoryFiltersValues>(getDefaultFilters);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);

    try {
      const response = await getHistory();
      setHistory(response);
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const filteredHistory = useMemo(() => {
    const startBoundary = filters.startDate ? new Date(`${filters.startDate}T00:00:00`) : null;
    const endBoundary = filters.endDate ? new Date(`${filters.endDate}T23:59:59.999`) : null;
    const normalizedSku = filters.sku.trim().toLowerCase();
    const normalizedTagId = filters.tagId.trim().toLowerCase();

    return history.filter((item) => {
      const createdAt = new Date(item.createdAt);
      const matchStart = !startBoundary || createdAt >= startBoundary;
      const matchEnd = !endBoundary || createdAt <= endBoundary;
      const matchSku = normalizedSku.length === 0 || item.sku.toLowerCase().includes(normalizedSku);
      const matchTagId = normalizedTagId.length === 0 || item.tagId.toLowerCase().includes(normalizedTagId);
      const matchStatus =
        filters.status === 'ALL' ||
        (filters.status === 'SUCCESS' && item.status === 'CONFIRMED') ||
        (filters.status !== 'SUCCESS' && item.status === filters.status);

      return matchStart && matchEnd && matchSku && matchTagId && matchStatus;
    });
  }, [filters, history]);

  const applyFilters = useCallback((nextFilters: HistoryFiltersValues) => {
    if (nextFilters.startDate && nextFilters.endDate && nextFilters.startDate > nextFilters.endDate) {
      setValidationMessage('A data inicial não pode ser maior que a data final.');
      return;
    }

    setValidationMessage(null);
    setFilters(nextFilters);
  }, []);

  const clearFilters = useCallback(() => {
    setValidationMessage(null);
    setFilters(getDefaultFilters());
  }, []);

  return (
    <div className="container-fluid px-0 history-page">
      <header className="mb-4">
        <h1 className="h3 mb-1">Histórico</h1>
        <p className="text-muted mb-0">Auditoria de alterações e atualizações enviadas às etiquetas.</p>
      </header>

      {hasError ? (
        <div className="alert alert-danger d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3" role="alert">
          <span>Erro ao carregar histórico.</span>
          <button className="btn btn-outline-danger btn-sm" type="button" onClick={() => void loadHistory()}>
            Tentar novamente
          </button>
        </div>
      ) : (
        <>
          <HistoryFiltersBar filters={filters} validationMessage={validationMessage} onApply={applyFilters} onClear={clearFilters} />

          {isLoading ? (
            <div className="card border-0 shadow-sm">
              <div className="card-body py-5 d-flex justify-content-center align-items-center gap-3">
                <div className="spinner-border text-primary" role="status" />
                <span>Carregando histórico...</span>
              </div>
            </div>
          ) : (
            <HistoryTable items={filteredHistory} onViewTag={(tagId) => navigate(`/etiquetas?tagId=${encodeURIComponent(tagId)}`)} />
          )}
        </>
      )}
    </div>
  );
}

export default Historico;

import { useCallback, useEffect, useMemo, useState } from 'react';
import AlertFiltersBar from '../components/alerts/AlertFiltersBar';
import AlertsTable from '../components/alerts/AlertsTable';
import { useNavigate } from '../lib/router';
import { getAlerts, resolveAlert } from '../services/alertsService';
import type { AlertItem, AlertsFiltersValues } from '../types/alerts';

const initialFilters: AlertsFiltersValues = {
  type: 'ALL',
  priority: 'ALL',
  status: 'OPEN',
  query: ''
};

function Alertas() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [filters, setFilters] = useState<AlertsFiltersValues>(initialFilters);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isResolvingById, setIsResolvingById] = useState<Record<string, boolean>>({});
  const navigate = useNavigate();

  const loadAlerts = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);

    try {
      const response = await getAlerts();
      setAlerts(response);
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAlerts();
  }, [loadAlerts]);

  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      const matchType = filters.type === 'ALL' || alert.type === filters.type;
      const matchPriority = filters.priority === 'ALL' || alert.priority === filters.priority;
      const matchStatus = filters.status === 'ALL' || alert.status === filters.status;

      const query = filters.query.trim().toLowerCase();
      const matchQuery =
        query.length === 0 ||
        alert.tagId.toLowerCase().includes(query) ||
        alert.sku.toLowerCase().includes(query) ||
        alert.productName.toLowerCase().includes(query);

      return matchType && matchPriority && matchStatus && matchQuery;
    });
  }, [alerts, filters]);

  const handleResolveAlert = useCallback(
    async (id: string) => {
      const target = alerts.find((alert) => alert.id === id);

      if (!target || target.status === 'RESOLVED') {
        return;
      }

      setActionError(null);
      setActionFeedback(null);
      setIsResolvingById((current) => ({ ...current, [id]: true }));
      setAlerts((current) => current.map((alert) => (alert.id === id ? { ...alert, status: 'RESOLVED' } : alert)));

      try {
        await resolveAlert(id);
        setActionFeedback(`Alerta ${id} marcado como resolvido.`);
      } catch {
        setAlerts((current) => current.map((alert) => (alert.id === id ? { ...alert, status: 'OPEN' } : alert)));
        setActionError('Não foi possível resolver. Tente novamente.');
      } finally {
        setIsResolvingById((current) => ({ ...current, [id]: false }));
      }
    },
    [alerts]
  );

  return (
    <div className="container-fluid px-0 alerts-page">
      <header className="mb-4">
        <h1 className="h3 mb-1">Alertas</h1>
        <p className="text-muted mb-0">Central de incidentes operacionais das etiquetas ESL.</p>
      </header>

      {actionFeedback ? (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          {actionFeedback}
          <button type="button" className="btn-close" aria-label="Close" onClick={() => setActionFeedback(null)} />
        </div>
      ) : null}

      {actionError ? (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {actionError}
          <button type="button" className="btn-close" aria-label="Close" onClick={() => setActionError(null)} />
        </div>
      ) : null}

      {hasError ? (
        <div className="alert alert-danger d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3" role="alert">
          <span>Erro ao carregar alertas.</span>
          <button className="btn btn-outline-danger btn-sm" type="button" onClick={() => void loadAlerts()}>
            Tentar novamente
          </button>
        </div>
      ) : (
        <>
          <AlertFiltersBar filters={filters} onFilterChange={setFilters} onClearFilters={() => setFilters(initialFilters)} />

          {isLoading ? (
            <div className="card border-0 shadow-sm">
              <div className="card-body py-5 d-flex justify-content-center align-items-center gap-3">
                <div className="spinner-border text-primary" role="status" />
                <span>Carregando alertas...</span>
              </div>
            </div>
          ) : (
            <AlertsTable
              alerts={filteredAlerts}
              isResolvingById={isResolvingById}
              onResolve={handleResolveAlert}
              onViewTag={(tagId) => navigate(`/etiquetas?tagId=${encodeURIComponent(tagId)}`)}
            />
          )}
        </>
      )}
    </div>
  );
}

export default Alertas;

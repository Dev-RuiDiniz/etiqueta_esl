import { useEffect, useMemo, useState } from 'react';
import AlertFiltersBar from '../components/alerts/AlertFiltersBar';
import AlertsTable from '../components/alerts/AlertsTable';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import LoadingState from '../components/common/LoadingState';
import useAsync from '../hooks/useAsync';
import { useNavigate, useSearchParams } from '../lib/router';
import { getAlerts, resolveAlert } from '../services/alertsService';
import type { AlertItem, AlertsFiltersValues } from '../types/alerts';

const initialFilters: AlertsFiltersValues = {
  type: 'ALL',
  priority: 'ALL',
  status: 'OPEN',
  query: ''
};

function Alertas() {
  const [filters, setFilters] = useState<AlertsFiltersValues>(initialFilters);
  const [searchParams, setSearchParams] = useSearchParams();
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isResolvingById, setIsResolvingById] = useState<Record<string, boolean>>({});
  const navigate = useNavigate();

  const {
    data: alertsData,
    loading,
    error,
    run: reloadAlerts,
    setData: setAlerts
  } = useAsync(getAlerts, []);

  const alerts = useMemo(() => alertsData ?? [], [alertsData]);

  useEffect(() => {
    const type = searchParams.get('type');
    const priority = searchParams.get('priority');
    const status = searchParams.get('status');
    const query = searchParams.get('q');

    setFilters((current) => ({
      ...current,
      type: (type as AlertsFiltersValues['type']) ?? 'ALL',
      priority: (priority as AlertsFiltersValues['priority']) ?? 'ALL',
      status: (status as AlertsFiltersValues['status']) ?? 'OPEN',
      query: query ?? ''
    }));
  }, [searchParams]);

  const updateFilters = (nextFilters: AlertsFiltersValues) => {
    setFilters(nextFilters);

    const nextSearchParams = new URLSearchParams(searchParams);

    if (nextFilters.type === 'ALL') nextSearchParams.delete('type');
    else nextSearchParams.set('type', nextFilters.type);

    if (nextFilters.priority === 'ALL') nextSearchParams.delete('priority');
    else nextSearchParams.set('priority', nextFilters.priority);

    if (nextFilters.status === 'OPEN') nextSearchParams.delete('status');
    else nextSearchParams.set('status', nextFilters.status);

    if (nextFilters.query.trim()) nextSearchParams.set('q', nextFilters.query.trim());
    else nextSearchParams.delete('q');

    setSearchParams(nextSearchParams, { replace: true });
  };

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

  const handleResolveAlert = async (id: string) => {
    const target = alerts.find((alert) => alert.id === id);

    if (!target || target.status === 'RESOLVED') {
      return;
    }

    setActionError(null);
    setActionFeedback(null);
    setIsResolvingById((current) => ({ ...current, [id]: true }));
    setAlerts((currentAlerts) =>
      (currentAlerts ?? []).map((alert) => (alert.id === id ? { ...alert, status: 'RESOLVED' as AlertItem['status'] } : alert))
    );

    try {
      await resolveAlert(id);
      setActionFeedback(`Alerta ${id} marcado como resolvido.`);
    } catch {
      setAlerts((currentAlerts) =>
        (currentAlerts ?? []).map((alert) => (alert.id === id ? { ...alert, status: 'OPEN' as AlertItem['status'] } : alert))
      );
      setActionError('Não foi possível resolver o alerta. Tente novamente.');
    } finally {
      setIsResolvingById((current) => ({ ...current, [id]: false }));
    }
  };

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

      {error ? (
        <ErrorState
          title="Não foi possível carregar os alertas"
          message="Atualize a tela para retomar o acompanhamento dos incidentes."
          onRetry={() => {
            void reloadAlerts();
          }}
        />
      ) : null}

      <AlertFiltersBar filters={filters} onFilterChange={updateFilters} onClearFilters={() => updateFilters(initialFilters)} />

      {loading ? (
        <LoadingState variant="spinner" message="Carregando alertas..." />
      ) : filteredAlerts.length === 0 ? (
        <EmptyState
          title="Nenhum alerta no filtro atual"
          description="Não há incidentes pendentes para os critérios escolhidos agora."
          action={
            <button className="btn btn-outline-secondary" type="button" onClick={() => updateFilters(initialFilters)}>
              Limpar filtros
            </button>
          }
        />
      ) : (
        <AlertsTable
          alerts={filteredAlerts}
          isResolvingById={isResolvingById}
          onResolve={(alertId) => {
            void handleResolveAlert(alertId);
          }}
          onViewTag={(tagId) => navigate(`/etiquetas?tagId=${encodeURIComponent(tagId)}`)}
        />
      )}
    </div>
  );
}

export default Alertas;

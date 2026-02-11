import { useEffect, useState } from 'react';
import type { AlertsFiltersValues } from '../../types/alerts';

type AlertFiltersBarProps = {
  filters: AlertsFiltersValues;
  onFilterChange: (nextFilters: AlertsFiltersValues) => void;
  onClearFilters: () => void;
};

const SEARCH_DEBOUNCE_MS = 250;

function AlertFiltersBar({ filters, onFilterChange, onClearFilters }: AlertFiltersBarProps) {
  const [queryDraft, setQueryDraft] = useState(filters.query);

  useEffect(() => {
    setQueryDraft(filters.query);
  }, [filters.query]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (queryDraft !== filters.query) {
        onFilterChange({ ...filters, query: queryDraft });
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [filters, onFilterChange, queryDraft]);

  return (
    <section className="card border-0 shadow-sm mb-3">
      <div className="card-body">
        <div className="row g-3 align-items-end">
          <div className="col-12 col-md-6 col-lg-2">
            <label className="form-label" htmlFor="alerts-filter-type">
              Tipo
            </label>
            <select
              id="alerts-filter-type"
              className="form-select"
              value={filters.type}
              onChange={(event) => onFilterChange({ ...filters, type: event.target.value as AlertsFiltersValues['type'] })}
            >
              <option value="ALL">Todos</option>
              <option value="LOW_BATTERY">Bateria baixa</option>
              <option value="OFFLINE">Offline</option>
              <option value="UPDATE_FAILED">Falha de atualização</option>
            </select>
          </div>

          <div className="col-12 col-md-6 col-lg-2">
            <label className="form-label" htmlFor="alerts-filter-priority">
              Prioridade
            </label>
            <select
              id="alerts-filter-priority"
              className="form-select"
              value={filters.priority}
              onChange={(event) =>
                onFilterChange({ ...filters, priority: event.target.value as AlertsFiltersValues['priority'] })
              }
            >
              <option value="ALL">Todas</option>
              <option value="HIGH">Alta</option>
              <option value="MEDIUM">Média</option>
            </select>
          </div>

          <div className="col-12 col-md-6 col-lg-2">
            <label className="form-label" htmlFor="alerts-filter-status">
              Status
            </label>
            <select
              id="alerts-filter-status"
              className="form-select"
              value={filters.status}
              onChange={(event) => onFilterChange({ ...filters, status: event.target.value as AlertsFiltersValues['status'] })}
            >
              <option value="OPEN">Abertos</option>
              <option value="RESOLVED">Resolvidos</option>
              <option value="ALL">Todos</option>
            </select>
          </div>

          <div className="col-12 col-md-6 col-lg-4">
            <label className="form-label" htmlFor="alerts-filter-query">
              Buscar
            </label>
            <input
              id="alerts-filter-query"
              className="form-control"
              type="search"
              placeholder="EtiquetaID, SKU ou Produto"
              value={queryDraft}
              onChange={(event) => setQueryDraft(event.target.value)}
            />
          </div>

          <div className="col-12 col-lg-2 d-grid">
            <button type="button" className="btn btn-outline-secondary" onClick={onClearFilters}>
              Limpar filtros
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AlertFiltersBar;

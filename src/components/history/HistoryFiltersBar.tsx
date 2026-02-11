import { useEffect, useState } from 'react';
import type { HistoryFiltersValues } from '../../types/history';

type HistoryFiltersBarProps = {
  filters: HistoryFiltersValues;
  validationMessage: string | null;
  onApply: (nextFilters: HistoryFiltersValues) => void;
  onClear: () => void;
};

function HistoryFiltersBar({ filters, validationMessage, onApply, onClear }: HistoryFiltersBarProps) {
  const [draft, setDraft] = useState<HistoryFiltersValues>(filters);

  useEffect(() => {
    setDraft(filters);
  }, [filters]);

  return (
    <section className="card border-0 shadow-sm mb-3">
      <div className="card-body">
        {validationMessage ? (
          <div className="alert alert-warning" role="alert">
            {validationMessage}
          </div>
        ) : null}

        <div className="row g-3 align-items-end">
          <div className="col-12 col-md-6 col-lg-2">
            <label className="form-label" htmlFor="history-filter-start-date">
              Data inicial
            </label>
            <input
              id="history-filter-start-date"
              type="date"
              className="form-control"
              value={draft.startDate}
              onChange={(event) => setDraft({ ...draft, startDate: event.target.value })}
            />
          </div>

          <div className="col-12 col-md-6 col-lg-2">
            <label className="form-label" htmlFor="history-filter-end-date">
              Data final
            </label>
            <input
              id="history-filter-end-date"
              type="date"
              className="form-control"
              value={draft.endDate}
              onChange={(event) => setDraft({ ...draft, endDate: event.target.value })}
            />
          </div>

          <div className="col-12 col-md-6 col-lg-2">
            <label className="form-label" htmlFor="history-filter-sku">
              SKU
            </label>
            <input
              id="history-filter-sku"
              type="text"
              className="form-control"
              placeholder="SKU-10001"
              value={draft.sku}
              onChange={(event) => setDraft({ ...draft, sku: event.target.value })}
            />
          </div>

          <div className="col-12 col-md-6 col-lg-2">
            <label className="form-label" htmlFor="history-filter-tag-id">
              EtiquetaID
            </label>
            <input
              id="history-filter-tag-id"
              type="text"
              className="form-control"
              placeholder="TAG-0001"
              value={draft.tagId}
              onChange={(event) => setDraft({ ...draft, tagId: event.target.value })}
            />
          </div>

          <div className="col-12 col-md-6 col-lg-2">
            <label className="form-label" htmlFor="history-filter-status">
              Status
            </label>
            <select
              id="history-filter-status"
              className="form-select"
              value={draft.status}
              onChange={(event) => setDraft({ ...draft, status: event.target.value as HistoryFiltersValues['status'] })}
            >
              <option value="ALL">Todos</option>
              <option value="SUCCESS">Sucesso</option>
              <option value="FAILED">Falha</option>
              <option value="SENT">Enviado</option>
              <option value="CONFIRMED">Confirmado</option>
            </select>
          </div>

          <div className="col-12 col-lg-2 d-flex gap-2">
            <button type="button" className="btn btn-primary flex-fill" onClick={() => onApply(draft)}>
              Aplicar filtros
            </button>
            <button type="button" className="btn btn-outline-secondary flex-fill" onClick={onClear}>
              Limpar filtros
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HistoryFiltersBar;

import { useEffect, useState } from 'react';

type TagFiltersValues = {
  status: 'ALL' | 'ONLINE' | 'OFFLINE';
  category: string;
  corridor: string;
  query: string;
};

type TagFiltersProps = {
  filters: TagFiltersValues;
  categories: string[];
  corridors: string[];
  onFilterChange: (nextFilters: TagFiltersValues) => void;
  onClearFilters: () => void;
};

const SEARCH_DEBOUNCE_MS = 300;

function TagFilters({ filters, categories, corridors, onFilterChange, onClearFilters }: TagFiltersProps) {
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
            <label className="form-label" htmlFor="filter-status">
              Status
            </label>
            <select
              id="filter-status"
              className="form-select"
              value={filters.status}
              onChange={(event) => onFilterChange({ ...filters, status: event.target.value as TagFiltersValues['status'] })}
            >
              <option value="ALL">Todos</option>
              <option value="ONLINE">Online</option>
              <option value="OFFLINE">Offline</option>
            </select>
          </div>

          <div className="col-12 col-md-6 col-lg-3">
            <label className="form-label" htmlFor="filter-category">
              Categoria
            </label>
            <select
              id="filter-category"
              className="form-select"
              value={filters.category}
              onChange={(event) => onFilterChange({ ...filters, category: event.target.value })}
            >
              <option value="ALL">Todos</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div className="col-12 col-md-6 col-lg-3">
            <label className="form-label" htmlFor="filter-corridor">
              Corredor
            </label>
            <select
              id="filter-corridor"
              className="form-select"
              value={filters.corridor}
              onChange={(event) => onFilterChange({ ...filters, corridor: event.target.value })}
            >
              <option value="ALL">Todos</option>
              {corridors.map((corridor) => (
                <option key={corridor} value={corridor}>
                  {corridor}
                </option>
              ))}
            </select>
          </div>

          <div className="col-12 col-md-6 col-lg-3">
            <label className="form-label" htmlFor="filter-query">
              Buscar
            </label>
            <input
              id="filter-query"
              className="form-control"
              type="search"
              placeholder="SKU, Produto ou EtiquetaID"
              value={queryDraft}
              onChange={(event) => setQueryDraft(event.target.value)}
            />
          </div>

          <div className="col-12 col-lg-2 d-grid">
            <button className="btn btn-outline-secondary" type="button" onClick={onClearFilters}>
              Limpar filtros
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export type { TagFiltersValues };
export default TagFilters;

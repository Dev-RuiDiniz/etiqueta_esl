import { useEffect, useMemo, useState } from 'react';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import LoadingState from '../components/common/LoadingState';
import TagDetailsModal from '../components/TagDetailsModal';
import TagFilters from '../components/TagFilters';
import TagTable from '../components/TagTable';
import useAsync from '../hooks/useAsync';
import { useSearchParams } from '../lib/router';
import { getTagFilterOptions, getTags } from '../services/tagsService';
import type { Tag, TagFiltersValues } from '../types/tags';

const initialFilters: TagFiltersValues = {
  status: 'ALL',
  category: 'ALL',
  corridor: 'ALL',
  query: ''
};

function Etiquetas() {
  const [filters, setFilters] = useState<TagFiltersValues>(initialFilters);
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    data: tagsData,
    loading,
    error,
    run: reloadTags
  } = useAsync(getTags, []);

  const { data: filterOptions } = useAsync(getTagFilterOptions, []);

  const tags = useMemo(() => tagsData ?? [], [tagsData]);

  useEffect(() => {
    const status = searchParams.get('status') as TagFiltersValues['status'] | null;
    const category = searchParams.get('category');
    const corridor = searchParams.get('corridor');
    const query = searchParams.get('q');
    const tagId = searchParams.get('tagId');

    setFilters((current) => ({
      ...current,
      status: status ?? 'ALL',
      category: category ?? 'ALL',
      corridor: corridor ?? 'ALL',
      query: tagId ?? query ?? ''
    }));

    if (tagId && tags.length > 0) {
      const target = tags.find((tag) => tag.tagId === tagId);
      if (target) {
        setSelectedTag(target);
      }
    }
  }, [searchParams, tags]);

  const updateFilters = (nextFilters: TagFiltersValues) => {
    setFilters(nextFilters);

    const nextSearchParams = new URLSearchParams(searchParams);

    if (nextFilters.status === 'ALL') nextSearchParams.delete('status');
    else nextSearchParams.set('status', nextFilters.status);

    if (nextFilters.category === 'ALL') nextSearchParams.delete('category');
    else nextSearchParams.set('category', nextFilters.category);

    if (nextFilters.corridor === 'ALL') nextSearchParams.delete('corridor');
    else nextSearchParams.set('corridor', nextFilters.corridor);

    if (nextFilters.query.trim()) nextSearchParams.set('q', nextFilters.query.trim());
    else nextSearchParams.delete('q');

    nextSearchParams.delete('tagId');
    setSearchParams(nextSearchParams, { replace: true });
  };

  const clearFilters = () => {
    setSelectedTag(null);
    setFilters(initialFilters);
    setSearchParams({}, { replace: true });
  };

  const filteredTags = useMemo(() => {
    return tags.filter((tag) => {
      const matchStatus = filters.status === 'ALL' || tag.status === filters.status;
      const matchCategory = filters.category === 'ALL' || tag.category === filters.category;
      const matchCorridor = filters.corridor === 'ALL' || tag.corridor === filters.corridor;

      const query = filters.query.trim().toLowerCase();
      const matchQuery =
        query.length === 0 ||
        tag.tagId.toLowerCase().includes(query) ||
        tag.sku.toLowerCase().includes(query) ||
        tag.productName.toLowerCase().includes(query);

      return matchStatus && matchCategory && matchCorridor && matchQuery;
    });
  }, [filters, tags]);

  return (
    <div className="container-fluid px-0 tags-page">
      <header className="mb-4">
        <h1 className="h3 mb-1">Etiquetas</h1>
        <p className="text-muted mb-0">Visão operacional das etiquetas com status, bateria e localização.</p>
      </header>

      {error ? (
        <ErrorState
          title="Não foi possível carregar as etiquetas"
          message="Verifique sua conexão e tente novamente para continuar o monitoramento."
          onRetry={() => {
            void reloadTags();
          }}
        />
      ) : null}

      <TagFilters
        filters={filters}
        categories={filterOptions?.categories ?? []}
        corridors={filterOptions?.corridors ?? []}
        onFilterChange={updateFilters}
        onClearFilters={clearFilters}
      />

      {loading ? (
        <LoadingState variant="skeleton" lines={8} />
      ) : filteredTags.length === 0 ? (
        <EmptyState
          title="Nenhuma etiqueta encontrada para os filtros selecionados."
          description="Ajuste os filtros para localizar os itens desejados."
          action={
            <button className="btn btn-outline-secondary" type="button" onClick={clearFilters}>
              Limpar filtros
            </button>
          }
        />
      ) : (
        <TagTable tags={filteredTags} onViewDetails={setSelectedTag} />
      )}

      <TagDetailsModal isOpen={Boolean(selectedTag)} tag={selectedTag} onClose={() => setSelectedTag(null)} />
    </div>
  );
}

export default Etiquetas;

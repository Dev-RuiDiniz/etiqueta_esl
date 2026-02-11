import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from '../lib/router';
import TagDetailsModal from '../components/TagDetailsModal';
import TagFilters, { type TagFiltersValues } from '../components/TagFilters';
import TagTable from '../components/TagTable';
import { tagCategories, tagCorridors, type Tag } from '../mocks/tags';
import { getTags } from '../services/tagsService';

const initialFilters: TagFiltersValues = {
  status: 'ALL',
  category: 'ALL',
  corridor: 'ALL',
  query: ''
};

function Etiquetas() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [filters, setFilters] = useState<TagFiltersValues>(initialFilters);
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const [hasError, setHasError] = useState(false);

  const loadTags = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);

    try {
      const response = await getTags();
      setTags(response);
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTags();
  }, [loadTags]);

  useEffect(() => {
    const tagIdFromQuery = searchParams.get('tagId');

    if (!tagIdFromQuery) {
      return;
    }

    setFilters((current) => {
      if (current.query === tagIdFromQuery) {
        return current;
      }

      return { ...current, query: tagIdFromQuery };
    });
  }, [searchParams]);

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
        <p className="text-muted mb-0">Visão operacional das ESL com status, bateria e localização.</p>
      </header>

      {hasError ? (
        <div className="alert alert-danger d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3" role="alert">
          <span>Erro ao carregar etiquetas.</span>
          <button className="btn btn-outline-danger btn-sm" type="button" onClick={() => void loadTags()}>
            Tentar novamente
          </button>
        </div>
      ) : (
        <>
          <TagFilters
            filters={filters}
            categories={tagCategories}
            corridors={tagCorridors}
            onFilterChange={setFilters}
            onClearFilters={() => setFilters(initialFilters)}
          />

          <TagTable tags={filteredTags} isLoading={isLoading} onViewDetails={setSelectedTag} />
        </>
      )}

      <TagDetailsModal isOpen={Boolean(selectedTag)} tag={selectedTag} onClose={() => setSelectedTag(null)} />
    </div>
  );
}

export default Etiquetas;

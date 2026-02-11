import type { PriceUpdateItem } from '../types/updates';
import { formatCurrencyBRL } from '../utils/format';
import UpdateStatusBadge from './UpdateStatusBadge';

type BulkUpdateTableProps = {
  items: PriceUpdateItem[];
  isProcessing: boolean;
  onRetryItem: (itemId: string) => void;
};

function BulkUpdateTable({ items, isProcessing, onRetryItem }: BulkUpdateTableProps) {
  if (items.length === 0) {
    return <div className="alert alert-secondary mb-0">Nenhum item processado ainda.</div>;
  }

  return (
    <div className="card border-0 shadow-sm mt-4">
      <div className="card-body">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h3 className="h6 mb-0">Itens processados</h3>
          {isProcessing ? (
            <div className="d-flex align-items-center gap-2 text-muted small">
              <div className="spinner-border spinner-border-sm" role="status" />
              <span>Processando confirmações...</span>
            </div>
          ) : null}
        </div>

        <div className="table-responsive">
          <table className="table align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th scope="col">Item</th>
                <th scope="col">Novo preço</th>
                <th scope="col">Status</th>
                <th scope="col" className="text-end">
                  Ação
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const displayName = item.tagId ? `${item.tagId}${item.sku ? ` (${item.sku})` : ''}` : item.sku ?? item.id;

                return (
                  <tr key={item.id}>
                    <td>{displayName}</td>
                    <td>{formatCurrencyBRL(item.newPrice)}</td>
                    <td>
                      <UpdateStatusBadge status={item.status} />
                      {item.errorMessage ? <div className="small text-danger mt-1">{item.errorMessage}</div> : null}
                    </td>
                    <td className="text-end">
                      {item.status === 'FAILED' ? (
                        <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => onRetryItem(item.id)}>
                          Retry
                        </button>
                      ) : (
                        <span className="text-muted small">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default BulkUpdateTable;

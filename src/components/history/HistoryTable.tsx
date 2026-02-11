import type { HistoryItem } from '../../types/history';
import { formatCurrencyBRL, formatDateTimeBR } from '../../utils/format';
import HistorySourceBadge from './HistorySourceBadge';
import HistoryStatusBadge from './HistoryStatusBadge';

type HistoryTableProps = {
  items: HistoryItem[];
  onViewTag: (tagId: string) => void;
};

function HistoryTable({ items, onViewTag }: HistoryTableProps) {
  return (
    <div className="card border-0 shadow-sm">
      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light">
            <tr>
              <th scope="col">Data/hora</th>
              <th scope="col">Produto</th>
              <th scope="col">SKU</th>
              <th scope="col">EtiquetaID</th>
              <th scope="col">Preço anterior</th>
              <th scope="col">Novo preço</th>
              <th scope="col">Status</th>
              <th scope="col">Origem</th>
              <th scope="col" className="text-end">
                Ação
              </th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-5 text-muted text-center">
                  Nenhum registro encontrado
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id}>
                  <td>{formatDateTimeBR(item.createdAt)}</td>
                  <td>{item.productName}</td>
                  <td>{item.sku}</td>
                  <td>{item.tagId}</td>
                  <td>{formatCurrencyBRL(item.previousPrice)}</td>
                  <td>{formatCurrencyBRL(item.newPrice)}</td>
                  <td>
                    <HistoryStatusBadge status={item.status} />
                  </td>
                  <td>
                    <HistorySourceBadge source={item.source} />
                  </td>
                  <td className="text-end">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => onViewTag(item.tagId)}
                    >
                      Ver etiqueta
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default HistoryTable;

import type { Tag } from '../types/tags';
import { formatCurrencyBRL } from '../utils/format';
import BadgeStatus from './BadgeStatus';
import BatteryBadge from './BatteryBadge';

type TagTableProps = {
  tags: Tag[];
  onViewDetails: (tag: Tag) => void;
};

function TagTable({ tags, onViewDetails }: TagTableProps) {
  return (
    <div className="card border-0 shadow-sm">
      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light">
            <tr>
              <th scope="col">EtiquetaID</th>
              <th scope="col">SKU</th>
              <th scope="col">Produto</th>
              <th scope="col">Preço (R$)</th>
              <th scope="col">Status</th>
              <th scope="col">Bateria (%)</th>
              <th scope="col">Localização</th>
              <th scope="col" className="text-end">
                Ações
              </th>
            </tr>
          </thead>
          <tbody>
            {tags.map((tag) => (
              <tr key={tag.tagId}>
                <td className="fw-semibold">{tag.tagId}</td>
                <td>{tag.sku}</td>
                <td>{tag.productName}</td>
                <td>{formatCurrencyBRL(tag.price)}</td>
                <td>
                  <BadgeStatus status={tag.status} />
                </td>
                <td>
                  <BatteryBadge battery={tag.battery} />
                </td>
                <td>{tag.location}</td>
                <td className="text-end">
                  <button className="btn btn-sm btn-outline-primary" type="button" onClick={() => onViewDetails(tag)}>
                    Ver detalhes
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TagTable;

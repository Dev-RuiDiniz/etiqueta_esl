import type { AlertItem } from '../../types/alerts';
import { formatDateTimeBR } from '../../utils/format';
import AlertPriorityBadge from './AlertPriorityBadge';
import AlertStatusBadge from './AlertStatusBadge';
import AlertTypeBadge from './AlertTypeBadge';

type AlertsTableProps = {
  alerts: AlertItem[];
  isResolvingById: Record<string, boolean>;
  onResolve: (alertId: string) => void;
  onViewTag: (tagId: string) => void;
};

function AlertsTable({ alerts, isResolvingById, onResolve, onViewTag }: AlertsTableProps) {
  return (
    <div className="card border-0 shadow-sm">
      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light">
            <tr>
              <th scope="col">Data/hora</th>
              <th scope="col">Tipo</th>
              <th scope="col">Prioridade</th>
              <th scope="col">EtiquetaID</th>
              <th scope="col">Produto</th>
              <th scope="col">Localização</th>
              <th scope="col">Status</th>
              <th scope="col" className="text-end">
                Ações
              </th>
            </tr>
          </thead>
          <tbody>
            {alerts.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-5 text-muted text-center">
                  Nenhum alerta encontrado
                </td>
              </tr>
            ) : (
              alerts.map((alert) => {
                const isResolving = Boolean(isResolvingById[alert.id]);

                return (
                  <tr key={alert.id} className={alert.status === 'OPEN' ? 'alerts-open-row' : undefined}>
                    <td>
                      <div>{formatDateTimeBR(alert.createdAt)}</div>
                      {alert.details ? <small className="text-muted">{alert.details}</small> : null}
                    </td>
                    <td>
                      <AlertTypeBadge type={alert.type} />
                    </td>
                    <td>
                      <AlertPriorityBadge priority={alert.priority} />
                    </td>
                    <td className="fw-semibold">{alert.tagId}</td>
                    <td>
                      <div>{alert.productName}</div>
                      <small className="text-muted">{alert.sku}</small>
                    </td>
                    <td>{alert.location}</td>
                    <td>
                      <AlertStatusBadge status={alert.status} />
                    </td>
                    <td className="text-end">
                      <div className="d-flex gap-2 justify-content-end flex-wrap">
                        {alert.status === 'OPEN' ? (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-success"
                            onClick={() => onResolve(alert.id)}
                            disabled={isResolving}
                          >
                            {isResolving ? 'Resolvendo...' : 'Marcar como resolvido'}
                          </button>
                        ) : null}
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => onViewTag(alert.tagId)}
                        >
                          Ver detalhes
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AlertsTable;

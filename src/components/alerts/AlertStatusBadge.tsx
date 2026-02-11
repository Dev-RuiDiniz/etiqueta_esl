import type { AlertStatus } from '../../types/alerts';

type AlertStatusBadgeProps = {
  status: AlertStatus;
};

function AlertStatusBadge({ status }: AlertStatusBadgeProps) {
  if (status === 'OPEN') {
    return <span className="badge text-bg-primary">Aberto</span>;
  }

  return <span className="badge text-bg-success">Resolvido</span>;
}

export default AlertStatusBadge;

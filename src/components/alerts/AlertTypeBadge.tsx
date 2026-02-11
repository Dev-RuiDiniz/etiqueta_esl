import type { AlertType } from '../../types/alerts';

type AlertTypeBadgeProps = {
  type: AlertType;
};

const typeLabels: Record<AlertType, string> = {
  LOW_BATTERY: 'Bateria baixa',
  OFFLINE: 'Offline',
  UPDATE_FAILED: 'Falha de atualização'
};

function AlertTypeBadge({ type }: AlertTypeBadgeProps) {
  const badgeClass =
    type === 'LOW_BATTERY' ? 'text-bg-warning text-dark' : type === 'OFFLINE' ? 'text-bg-secondary' : 'text-bg-dark';

  return <span className={`badge ${badgeClass}`}>{typeLabels[type]}</span>;
}

export default AlertTypeBadge;

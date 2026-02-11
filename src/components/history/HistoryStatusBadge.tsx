import type { HistoryStatus } from '../../types/history';

type HistoryStatusBadgeProps = {
  status: HistoryStatus;
};

const statusConfig: Record<HistoryStatus, { className: string; label: string }> = {
  SENT: { className: 'text-bg-primary', label: 'Enviado' },
  CONFIRMED: { className: 'text-bg-success', label: 'Confirmado' },
  FAILED: { className: 'text-bg-danger', label: 'Falha' }
};

function HistoryStatusBadge({ status }: HistoryStatusBadgeProps) {
  return <span className={`badge ${statusConfig[status].className}`}>{statusConfig[status].label}</span>;
}

export default HistoryStatusBadge;

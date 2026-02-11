import type { HistorySource } from '../../types/history';

type HistorySourceBadgeProps = {
  source: HistorySource;
};

const sourceConfig: Record<HistorySource, { className: string; label: string }> = {
  MANUAL: { className: 'text-bg-info', label: 'Manual' },
  BULK: { className: 'text-bg-secondary', label: 'Lote' },
  SYSTEM: { className: 'text-bg-dark', label: 'Sistema (mock)' }
};

function HistorySourceBadge({ source }: HistorySourceBadgeProps) {
  return <span className={`badge ${sourceConfig[source].className}`}>{sourceConfig[source].label}</span>;
}

export default HistorySourceBadge;

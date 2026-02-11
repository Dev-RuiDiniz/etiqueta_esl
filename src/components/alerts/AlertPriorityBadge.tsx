import type { AlertPriority } from '../../types/alerts';

type AlertPriorityBadgeProps = {
  priority: AlertPriority;
};

function AlertPriorityBadge({ priority }: AlertPriorityBadgeProps) {
  if (priority === 'HIGH') {
    return <span className="badge text-bg-danger">Alta</span>;
  }

  return <span className="badge text-bg-warning text-dark">Média</span>;
}

export default AlertPriorityBadge;

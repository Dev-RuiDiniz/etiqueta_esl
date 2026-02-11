import type { TagStatus } from '../types/tags';

type BadgeStatusProps = {
  status: TagStatus;
};

function BadgeStatus({ status }: BadgeStatusProps) {
  const className = status === 'ONLINE' ? 'text-bg-success' : 'text-bg-secondary';

  return <span className={`badge ${className}`}>{status === 'ONLINE' ? 'Online' : 'Offline'}</span>;
}

export default BadgeStatus;

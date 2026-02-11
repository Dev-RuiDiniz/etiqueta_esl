import type { UpdateStatus } from '../types/updates';

type UpdateStatusBadgeProps = {
  status: UpdateStatus;
};

const statusMap: Record<UpdateStatus, { label: string; className: string }> = {
  SENT: { label: 'Enviado', className: 'text-bg-info' },
  CONFIRMED: { label: 'Confirmado', className: 'text-bg-success' },
  FAILED: { label: 'Falha', className: 'text-bg-danger' }
};

function UpdateStatusBadge({ status }: UpdateStatusBadgeProps) {
  const mappedStatus = statusMap[status];

  return <span className={`badge ${mappedStatus.className}`}>Status: {mappedStatus.label}</span>;
}

export default UpdateStatusBadge;

import type { ReactNode } from 'react';

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="card border-0 shadow-sm app-surface empty-state-card">
      <div className="card-body py-5 text-center">
        <span className="empty-state-icon" aria-hidden="true">
          LiveLabel
        </span>
        <h2 className="h5">{title}</h2>
        <p className="text-muted mb-3">{description}</p>
        {action}
      </div>
    </div>
  );
}

export default EmptyState;

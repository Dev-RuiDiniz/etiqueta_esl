import type { ReactNode } from 'react';

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="card border-0 shadow-sm">
      <div className="card-body py-5 text-center">
        <h2 className="h5">{title}</h2>
        <p className="text-muted mb-3">{description}</p>
        {action}
      </div>
    </div>
  );
}

export default EmptyState;

type LoadingStateProps = {
  variant?: 'spinner' | 'skeleton';
  lines?: number;
  message?: string;
};

function LoadingState({ variant = 'skeleton', lines = 4, message = 'Carregando dados...' }: LoadingStateProps) {
  if (variant === 'spinner') {
    return (
      <div className="card border-0 shadow-sm">
        <div className="card-body py-5 d-flex justify-content-center align-items-center gap-3">
          <div className="spinner-border text-primary" role="status" />
          <span>{message}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="card border-0 shadow-sm placeholder-wave" aria-hidden="true">
      <div className="card-body">
        {Array.from({ length: lines }, (_, index) => (
          <p key={`placeholder-${index}`} className="placeholder-glow mb-3">
            <span className="placeholder col-12" />
          </p>
        ))}
      </div>
    </div>
  );
}

export default LoadingState;

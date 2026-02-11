type ErrorStateProps = {
  title: string;
  message: string;
  onRetry?: () => void;
};

function ErrorState({ title, message, onRetry }: ErrorStateProps) {
  return (
    <div className="alert alert-danger d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3" role="alert">
      <div>
        <p className="fw-semibold mb-1">{title}</p>
        <p className="mb-0">{message}</p>
      </div>

      {onRetry ? (
        <button className="btn btn-outline-danger btn-sm" type="button" onClick={onRetry}>
          Tentar novamente
        </button>
      ) : null}
    </div>
  );
}

export default ErrorState;

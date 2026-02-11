type KpiCardProps = {
  title: string;
  value: string | number;
  helperText?: string;
  icon?: string;
};

function KpiCard({ title, value, helperText = 'Atualizado agora', icon }: KpiCardProps) {
  return (
    <article className="card border-0 shadow-sm h-100 dashboard-kpi-card">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
          <p className="text-muted text-uppercase small mb-0">{title}</p>
          {icon ? <span aria-hidden="true">{icon}</span> : null}
        </div>
        <p className="display-6 fw-semibold mb-1">{value}</p>
        <p className="small text-muted mb-0">{helperText}</p>
      </div>
    </article>
  );
}

export default KpiCard;

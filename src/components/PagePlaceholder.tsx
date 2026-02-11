type KpiItem = {
  label: string;
  value: string;
};

type PagePlaceholderProps = {
  title: string;
  subtitle: string;
  kpis?: KpiItem[];
};

function PagePlaceholder({ title, subtitle, kpis = [] }: PagePlaceholderProps) {
  return (
    <section>
      <div className="mb-4">
        <h2 className="h3 mb-1">{title}</h2>
        <p className="text-muted mb-0">{subtitle}</p>
      </div>

      {kpis.length > 0 && (
        <div className="row g-3 mb-4">
          {kpis.map((kpi) => (
            <div className="col-12 col-md-6" key={kpi.label}>
              <article className="card shadow-sm h-100 border-0">
                <div className="card-body">
                  <p className="text-muted small mb-1">{kpi.label}</p>
                  <p className="h4 mb-0">{kpi.value}</p>
                </div>
              </article>
            </div>
          ))}
        </div>
      )}

      <article className="card border-0 shadow-sm">
        <div className="card-body">
          <h3 className="h5">Visão geral</h3>
          <p className="text-muted mb-0">Conteúdo em evolução para as próximas etapas do produto.</p>
        </div>
      </article>
    </section>
  );
}

export default PagePlaceholder;

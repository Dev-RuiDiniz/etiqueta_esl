type KpiItem = {
  label: string;
  value: string;
};

type PagePlaceholderProps = {
  title: string;
  subtitle: string;
  phaseHint?: string;
  kpis?: KpiItem[];
};

function PagePlaceholder({ title, subtitle, phaseHint = 'Fase 2', kpis = [] }: PagePlaceholderProps) {
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
          <h3 className="h5">Placeholder de implementação</h3>
          <p className="text-muted mb-0">Conteúdo será implementado na {phaseHint}.</p>
        </div>
      </article>
    </section>
  );
}

export default PagePlaceholder;

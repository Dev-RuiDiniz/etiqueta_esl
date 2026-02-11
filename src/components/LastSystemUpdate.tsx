import type { DashboardLastUpdate } from '../mocks/dashboard';

type LastSystemUpdateProps = {
  update: DashboardLastUpdate;
};

function LastSystemUpdate({ update }: LastSystemUpdateProps) {
  const formattedDate = new Date(update.timestamp).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  const badgeClass = update.status === 'Online' ? 'text-bg-success' : update.status === 'Offline' ? 'text-bg-secondary' : 'text-bg-warning';

  return (
    <section className="card border-0 shadow-sm h-100">
      <div className="card-body d-flex flex-column gap-2">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
          <h2 className="h6 mb-0">Última atualização do sistema</h2>
          <span className={`badge ${badgeClass}`}>{update.status}</span>
        </div>
        <p className="mb-0">Última atualização do sistema: {formattedDate}</p>
        <p className="small text-muted mb-0">Fonte: Simulação (mock)</p>
      </div>
    </section>
  );
}

export default LastSystemUpdate;

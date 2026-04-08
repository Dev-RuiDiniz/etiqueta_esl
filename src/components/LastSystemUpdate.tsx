import type { DashboardLastUpdate } from '../types/dashboard';
import { formatDateTimeBR } from '../utils/format';

type LastSystemUpdateProps = {
  update: DashboardLastUpdate;
};

function LastSystemUpdate({ update }: LastSystemUpdateProps) {
  const badgeClass =
    update.status === 'Online'
      ? 'status-pill status-pill--online'
      : update.status === 'Offline'
        ? 'status-pill status-pill--offline'
        : 'status-pill status-pill--attention';

  return (
    <section className="card border-0 shadow-sm h-100 app-surface">
      <div className="card-body d-flex flex-column gap-2">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
          <h2 className="h6 mb-0">Última leitura do ecossistema LiveLabel</h2>
          <span className={badgeClass}>{update.status}</span>
        </div>
        <p className="mb-0">Atualizado em: {formatDateTimeBR(update.timestamp)}</p>
      </div>
    </section>
  );
}

export default LastSystemUpdate;

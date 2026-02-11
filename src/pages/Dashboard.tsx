import { useMemo } from 'react';
import KpiCard from '../components/KpiCard';
import LastSystemUpdate from '../components/LastSystemUpdate';
import ErrorState from '../components/common/ErrorState';
import useAsync from '../hooks/useAsync';
import { getDashboardSummary } from '../services/dashboardService';

function Dashboard() {
  const { data: summary, loading: isLoading, error, run: reloadDashboard } = useAsync(getDashboardSummary, []);

  const kpiCards = useMemo(() => {
    if (!summary) {
      return [];
    }

    return [
      {
        title: 'Total de etiquetas',
        value: summary.kpis.totalTags,
        helperText: '+2 hoje',
        icon: '🏷️'
      },
      {
        title: 'Etiquetas online',
        value: summary.kpis.online,
        helperText: 'Conectadas agora',
        icon: '🟢'
      },
      {
        title: 'Etiquetas offline',
        value: summary.kpis.offline,
        helperText: 'Requer atenção',
        icon: '🔌'
      },
      {
        title: 'Bateria baixa',
        value: summary.kpis.lowBattery,
        helperText: 'Monitoradas hoje',
        icon: '🔋'
      }
    ];
  }, [summary]);

  return (
    <div className="container-fluid px-0 dashboard-page">
      <header className="mb-4">
        <h1 className="h3 mb-1">Dashboard</h1>
        <p className="text-muted mb-0">Visão geral do status das etiquetas e operação.</p>
      </header>

      {error ? (
        <ErrorState
          title="Não foi possível carregar o dashboard"
          message="Tente novamente para atualizar os indicadores operacionais."
          onRetry={() => {
            void reloadDashboard();
          }}
        />
      ) : null}

      <section className="row g-3 mb-4" aria-live="polite">
        {isLoading
          ? Array.from({ length: 4 }, (_, index) => (
              <div key={`kpi-skeleton-${index}`} className="col-12 col-sm-6 col-xl-3">
                <div className="card border-0 shadow-sm h-100 placeholder-glow">
                  <div className="card-body">
                    <span className="placeholder col-6 mb-3"></span>
                    <span className="placeholder col-4 placeholder-lg mb-3"></span>
                    <span className="placeholder col-7"></span>
                  </div>
                </div>
              </div>
            ))
          : kpiCards.map((kpi) => (
              <div key={kpi.title} className="col-12 col-sm-6 col-xl-3">
                <KpiCard title={kpi.title} value={kpi.value} helperText={kpi.helperText} icon={kpi.icon} />
              </div>
            ))}
      </section>

      <section className="row g-3">
        <div className="col-12 col-xl-8">
          <article className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h2 className="h6 mb-0">Offline por corredor</h2>
                <span className="small text-muted">Dados mockados</span>
              </div>

              {isLoading ? (
                <div className="placeholder-glow">
                  {Array.from({ length: 7 }, (_, index) => (
                    <div key={`corridor-skeleton-${index}`} className="d-flex align-items-center justify-content-between mb-3">
                      <span className="placeholder col-4"></span>
                      <span className="placeholder col-2"></span>
                    </div>
                  ))}
                </div>
              ) : (
                <ul className="list-group list-group-flush">
                  {summary?.offlineByCorridor.map((item) => (
                    <li key={item.corridor} className="list-group-item px-0 d-flex justify-content-between align-items-center">
                      <span>{item.corridor}</span>
                      <span className="badge text-bg-light border">{item.offline} offline</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </article>
        </div>

        <div className="col-12 col-xl-4">
          {isLoading ? (
            <div className="card border-0 shadow-sm h-100 placeholder-glow">
              <div className="card-body">
                <span className="placeholder col-7 mb-3"></span>
                <span className="placeholder col-10 mb-2"></span>
                <span className="placeholder col-5"></span>
              </div>
            </div>
          ) : summary ? (
            <LastSystemUpdate update={summary.lastUpdate} />
          ) : null}
        </div>
      </section>
    </div>
  );
}

export default Dashboard;

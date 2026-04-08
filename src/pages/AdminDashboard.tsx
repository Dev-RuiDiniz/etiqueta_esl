import KpiCard from '../components/KpiCard';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import LoadingState from '../components/common/LoadingState';
import useAsync from '../hooks/useAsync';
import { getAdminDashboardSummary } from '../services/adminService';

function AdminDashboard() {
  const { data, loading, error, run } = useAsync(getAdminDashboardSummary, []);

  const templateTypes = Object.entries(data?.templates.by_type ?? {});

  return (
    <div className="container-fluid px-0 admin-page">
      <header className="page-header mb-4">
        <div>
          <span className="eyebrow">Administração</span>
          <h1 className="h3 mb-1">Central de usuários e infraestrutura ESL</h1>
          <p className="text-muted mb-0">Acompanhe perfis, estações, templates e sinais operacionais em um único painel.</p>
        </div>
      </header>

      {error ? (
        <ErrorState
          title="Não foi possível carregar a central administrativa"
          message="Atualize a página para tentar novamente."
          onRetry={() => {
            void run();
          }}
        />
      ) : null}

      {loading ? (
        <LoadingState lines={8} />
      ) : data ? (
        <>
          <section className="row g-3 mb-4">
            <div className="col-12 col-sm-6 col-xl-3">
              <KpiCard title="Usuários ativos" value={data.users.active} helperText={`${data.users.total} cadastrados`} icon="👥" />
            </div>
            <div className="col-12 col-sm-6 col-xl-3">
              <KpiCard title="Base stations" value={data.stations.totals.stations} helperText={`${data.stations.totals.tags} etiquetas mapeadas`} icon="📡" />
            </div>
            <div className="col-12 col-sm-6 col-xl-3">
              <KpiCard title="Templates" value={data.templates.total} helperText="Modelos em cache operacional" icon="🧩" />
            </div>
            <div className="col-12 col-sm-6 col-xl-3">
              <KpiCard title="Falhas pendentes" value={data.alerts.pending_dead_letters} helperText="Dead-letters aguardando ação" icon="⚠️" />
            </div>
          </section>

          <section className="row g-4 mb-4">
            <div className="col-12 col-xl-7">
              <article className="app-surface p-4 h-100">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h2 className="h5 mb-1">Distribuição de perfis</h2>
                    <p className="text-muted small mb-0">Leitura rápida do RBAC operacional.</p>
                  </div>
                </div>
                <div className="row g-3">
                  <div className="col-12 col-md-4">
                    <div className="stat-block">
                      <span className="stat-label">Usuário</span>
                      <strong>{data.users.by_role.usuario ?? 0}</strong>
                    </div>
                  </div>
                  <div className="col-12 col-md-4">
                    <div className="stat-block">
                      <span className="stat-label">Administrador</span>
                      <strong>{data.users.by_role.administrador ?? 0}</strong>
                    </div>
                  </div>
                  <div className="col-12 col-md-4">
                    <div className="stat-block">
                      <span className="stat-label">Desenvolvedor</span>
                      <strong>{data.users.by_role.desenvolvedor ?? 0}</strong>
                    </div>
                  </div>
                </div>

                <div className="table-responsive mt-4">
                  <table className="table align-middle admin-table mb-0">
                    <thead>
                      <tr>
                        <th>Usuário recente</th>
                        <th>Perfil</th>
                        <th>Atualização</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.users.recent.map((user) => (
                        <tr key={user.id}>
                          <td>
                            <div className="fw-semibold">{user.email}</div>
                            <div className="small text-muted">{user.id}</div>
                          </td>
                          <td>
                            <span className="badge text-bg-light border text-capitalize">{user.role}</span>
                          </td>
                          <td>{user.updated_at ? new Date(user.updated_at).toLocaleString('pt-BR') : 'Agora'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>
            </div>

            <div className="col-12 col-xl-5">
              <article className="app-surface p-4 h-100">
                <h2 className="h5 mb-1">Saúde operacional ESL</h2>
                <p className="text-muted small mb-4">Resumo agregado sem sair da central administrativa.</p>
                <div className="row g-3">
                  <div className="col-6">
                    <div className="mini-stat success">
                      <span>Online</span>
                      <strong>{data.esl.kpis.online}</strong>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="mini-stat danger">
                      <span>Offline</span>
                      <strong>{data.esl.kpis.offline}</strong>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="mini-stat warning">
                      <span>Bateria baixa</span>
                      <strong>{data.esl.kpis.lowBattery}</strong>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="mini-stat neutral">
                      <span>Total de tags</span>
                      <strong>{data.esl.kpis.totalTags}</strong>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <h3 className="h6 mb-3">Top corredores com offline</h3>
                  {data.esl.offlineByCorridor.length === 0 ? (
                    <p className="small text-muted mb-0">Nenhuma concentração offline detectada no momento.</p>
                  ) : (
                    <ul className="list-unstyled mb-0">
                      {data.esl.offlineByCorridor.slice(0, 4).map((item) => (
                        <li key={item.corridor} className="admin-inline-list-item">
                          <span>{item.corridor}</span>
                          <strong>{item.offline}</strong>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </article>
            </div>
          </section>

          <section className="row g-4">
            <div className="col-12 col-xl-6">
              <article className="app-surface p-4 h-100">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h2 className="h5 mb-1">Base stations monitoradas</h2>
                    <p className="text-muted small mb-0">Acompanhamento resumido da malha física.</p>
                  </div>
                  <span className="badge text-bg-light border">{data.stations.totals.stations} estações</span>
                </div>

                {data.stations.recent.length === 0 ? (
                  <EmptyState
                    title="Nenhuma estação observada"
                    description="O painel exibirá stations assim que houver catálogo e status sincronizados."
                  />
                ) : (
                  <div className="table-responsive">
                    <table className="table align-middle admin-table mb-0">
                      <thead>
                        <tr>
                          <th>Station</th>
                          <th>Total</th>
                          <th>Online</th>
                          <th>Offline</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.stations.recent.map((station) => (
                          <tr key={station.station_code}>
                            <td>{station.station_code}</td>
                            <td>{station.total_tags}</td>
                            <td>{station.online_tags}</td>
                            <td>{station.offline_tags}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </article>
            </div>

            <div className="col-12 col-xl-6">
              <article className="app-surface p-4 h-100">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h2 className="h5 mb-1">Templates e sinais de risco</h2>
                    <p className="text-muted small mb-0">Visão rápida do catálogo de layouts e falhas recentes.</p>
                  </div>
                </div>

                <div className="row g-3 mb-4">
                  {templateTypes.length === 0 ? (
                    <div className="col-12">
                      <p className="small text-muted mb-0">Nenhum template disponível em cache no momento.</p>
                    </div>
                  ) : (
                    templateTypes.slice(0, 4).map(([type, total]) => (
                      <div key={type} className="col-6">
                        <div className="mini-stat neutral">
                          <span>{type}</span>
                          <strong>{total}</strong>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <h3 className="h6 mb-3">Últimos dead-letters</h3>
                {data.alerts.recent.length === 0 ? (
                  <p className="small text-muted mb-0">Sem falhas recentes na fila de tratamento.</p>
                ) : (
                  <ul className="list-unstyled mb-0">
                    {data.alerts.recent.map((alert) => (
                      <li key={alert.id} className="admin-alert-item">
                        <div>
                          <p className="fw-semibold mb-1">{alert.operation}</p>
                          <p className="small text-muted mb-0">{alert.last_error || 'Aguardando nova tentativa.'}</p>
                        </div>
                        <div className="text-end">
                          <span className="badge text-bg-light border mb-2">{alert.attempts} tentativa(s)</span>
                          <p className="small text-muted mb-0">{new Date(alert.created_at).toLocaleString('pt-BR')}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}

export default AdminDashboard;

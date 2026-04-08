import { NavLink } from '../lib/router';
import { canAccessAdmin, getEffectiveUser } from '../lib/auth';

type SidebarProps = {
  onNavigate?: () => void;
};

const primaryNavItems = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/etiquetas', label: 'Etiquetas', icon: '🏷️' },
  { to: '/produtos', label: 'Produtos', icon: '📦' },
  { to: '/atualizacoes/individual', label: 'Atualizações', icon: '🔄' },
  { to: '/alertas', label: 'Alertas', icon: '🔔' },
  { to: '/historico', label: 'Histórico', icon: '🕘' }
];

const adminNavItems = [
  { to: '/admin', label: 'Central Admin', icon: '🛠️' },
  { to: '/admin/usuarios', label: 'Usuários', icon: '👥' }
];

function Sidebar({ onNavigate }: SidebarProps) {
  const currentUser = getEffectiveUser();
  const showAdminNav = canAccessAdmin(currentUser);

  return (
    <aside className="sidebar-panel d-flex flex-column h-100 p-3 border-end">
      <div className="mb-4 px-2">
        <div className="sidebar-brand-mark mb-3">ESL</div>
        <h2 className="h5 mb-1">Central de Operação</h2>
        <p className="text-muted small mb-0">Monitoramento técnico e administração</p>
      </div>

      <nav className="nav nav-pills flex-column gap-1">
        {primaryNavItems.map((item) => (
          <NavLink
            key={item.to}
            className={({ isActive }) =>
              `nav-link d-flex align-items-center gap-2 sidebar-link ${isActive ? 'active' : ''}`
            }
            to={item.to}
            onClick={onNavigate}
          >
            <span aria-hidden="true">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {showAdminNav ? (
        <div className="sidebar-section mt-4 pt-4">
          <p className="sidebar-section-title mb-2">Administração</p>
          <nav className="nav nav-pills flex-column gap-1">
            {adminNavItems.map((item) => (
              <NavLink
                key={item.to}
                className={({ isActive }) =>
                  `nav-link d-flex align-items-center gap-2 sidebar-link ${isActive ? 'active' : ''}`
                }
                to={item.to}
                onClick={onNavigate}
              >
                <span aria-hidden="true">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      ) : null}
    </aside>
  );
}

export default Sidebar;

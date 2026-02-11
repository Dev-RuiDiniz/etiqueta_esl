import { NavLink } from '../lib/router';

type SidebarProps = {
  onNavigate?: () => void;
};

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/etiquetas', label: 'Etiquetas', icon: '🏷️' },
  { to: '/produtos', label: 'Produtos', icon: '📦' },
  { to: '/atualizacoes/individual', label: 'Atualizações', icon: '🔄' },
  { to: '/alertas', label: 'Alertas', icon: '🔔' },
  { to: '/historico', label: 'Histórico', icon: '🕘' }
];

function Sidebar({ onNavigate }: SidebarProps) {
  return (
    <aside className="d-flex flex-column h-100 p-3 bg-white border-end">
      <div className="mb-4 px-2">
        <h2 className="h5 mb-1">ESL Dashboard</h2>
        <p className="text-muted small mb-0">Painel operacional</p>
      </div>

      <nav className="nav nav-pills flex-column gap-1">
        {navItems.map((item) => (
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
    </aside>
  );
}

export default Sidebar;

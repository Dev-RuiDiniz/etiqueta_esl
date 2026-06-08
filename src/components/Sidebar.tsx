import { NavLink } from '../lib/router';
import { canAccessAdmin, getEffectiveUser } from '../lib/auth';
import BrandSignature from './BrandSignature';

type SidebarProps = {
  onNavigate?: () => void;
};

const primaryNavItems = [
  { to: '/dashboard', label: 'Visão Geral', icon: 'overview' },
  { to: '/etiquetas', label: 'Rede de Etiquetas', icon: 'network' },
  { to: '/produtos', label: 'Catálogo', icon: 'catalog' },
  { to: '/atualizacoes/individual', label: 'Atualizações', icon: 'refresh' },
  { to: '/alertas', label: 'Incidentes', icon: 'alerts' },
  { to: '/historico', label: 'Rastreabilidade', icon: 'history' }
];

const adminNavItems = [
  { to: '/admin', label: 'Cockpit Admin', icon: 'admin' },
  { to: '/admin/usuarios', label: 'Usuários', icon: 'users' }
];

function NavIcon({ name }: { name: string }) {
  return (
    <span className={`nav-icon nav-icon--${name}`} aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  );
}

function Sidebar({ onNavigate }: SidebarProps) {
  const currentUser = getEffectiveUser();
  const showAdminNav = canAccessAdmin(currentUser);

  return (
    <aside className="sidebar-panel d-flex flex-column h-100 p-3 border-end">
      <div className="mb-4 px-2">
        <BrandSignature theme="dark" showTagline />
        <div className="sidebar-intro mt-4">
          <h2 className="h5 mb-1">Cockpit operacional Vhera Tag</h2>
          <p className="text-muted small mb-0">Monitoramento inteligente de etiquetas digitais com precisão operacional e tecnologia industrial.</p>
        </div>
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
            <NavIcon name={item.icon} />
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
                <NavIcon name={item.icon} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      ) : null}

      <div className="sidebar-footer mt-auto pt-4">
        <div className="sidebar-footer-card">
          <span className="sidebar-footer-eyebrow">Posicionamento</span>
          <p className="mb-0">Etiquetas Digitais industriais para operação logística com precisão técnica e monitoramento em tempo real.</p>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;

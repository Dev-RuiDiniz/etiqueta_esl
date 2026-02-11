import BulkUpdateUploader from '../components/BulkUpdateUploader';
import SingleUpdateForm from '../components/SingleUpdateForm';
import { NavLink, Outlet, useSearchParams } from '../lib/router';

function AtualizacoesHub() {
  return (
    <div className="container-fluid px-0">
      <header className="mb-4">
        <h1 className="h3 mb-1">Atualizações</h1>
        <p className="text-muted mb-0">Fluxo demonstrativo de atualização de preços em etiquetas.</p>
      </header>

      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <NavLink
            end
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            to="/atualizacoes/individual"
          >
            Atualização individual
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} to="/atualizacoes/lote">
            Atualização em lote
          </NavLink>
        </li>
      </ul>

      <Outlet />
    </div>
  );
}

function AtualizacaoIndividualPage() {
  const [searchParams] = useSearchParams();

  return <SingleUpdateForm preselectedTagId={searchParams.get('tagId')} />;
}

function AtualizacaoLotePage() {
  return <BulkUpdateUploader />;
}

export { AtualizacaoIndividualPage, AtualizacaoLotePage };
export default AtualizacoesHub;

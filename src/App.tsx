import { Navigate, Route, Routes, useLocation } from './lib/router';
import AppLayout from './layouts/AppLayout';
import Alertas from './pages/Alertas';
import Atualizacoes, { AtualizacaoIndividualPage, AtualizacaoLotePage } from './pages/Atualizacoes';
import Dashboard from './pages/Dashboard';
import Etiquetas from './pages/Etiquetas';
import Historico from './pages/Historico';
import Login from './pages/Login';
import Produtos from './pages/Produtos';

function App() {
  const location = useLocation();

  const routes = (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/etiquetas" element={<Etiquetas />} />
      <Route path="/produtos" element={<Produtos />} />
      <Route path="/atualizacoes" element={<Atualizacoes />}>
        <Route index element={<Navigate to="/atualizacoes/individual" replace />} />
        <Route path="individual" element={<AtualizacaoIndividualPage />} />
        <Route path="lote" element={<AtualizacaoLotePage />} />
      </Route>
      <Route path="/alertas" element={<Alertas />} />
      <Route path="/historico" element={<Historico />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );

  // A tela de login não usa o shell operacional para evitar navegação lateral
  // quando o usuário ainda não possui sessão ou foi redirecionado por 401.
  if (location.pathname === '/login') {
    return routes;
  }

  return <AppLayout>{routes}</AppLayout>;
}

export default App;

import { Navigate, Route, Routes } from './lib/router';
import AppLayout from './layouts/AppLayout';
import Alertas from './pages/Alertas';
import Atualizacoes, { AtualizacaoIndividualPage, AtualizacaoLotePage } from './pages/Atualizacoes';
import Dashboard from './pages/Dashboard';
import Etiquetas from './pages/Etiquetas';
import Historico from './pages/Historico';
import Produtos from './pages/Produtos';

function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
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
      </Routes>
    </AppLayout>
  );
}

export default App;

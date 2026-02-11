import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import Alertas from './pages/Alertas';
import Atualizacoes from './pages/Atualizacoes';
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
        <Route path="/atualizacoes" element={<Atualizacoes />} />
        <Route path="/alertas" element={<Alertas />} />
        <Route path="/historico" element={<Historico />} />
      </Routes>
    </AppLayout>
  );
}

export default App;

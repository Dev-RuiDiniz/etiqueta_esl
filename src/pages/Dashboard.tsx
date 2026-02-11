import PagePlaceholder from '../components/PagePlaceholder';

function Dashboard() {
  return (
    <PagePlaceholder
      title="Dashboard"
      subtitle="Visão geral operacional das etiquetas eletrônicas da loja selecionada."
      kpis={[
        { label: 'Etiquetas sincronizadas hoje', value: '1.248' },
        { label: 'Alertas pendentes', value: '7' }
      ]}
    />
  );
}

export default Dashboard;

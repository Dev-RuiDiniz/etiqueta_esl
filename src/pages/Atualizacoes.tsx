import PagePlaceholder from '../components/PagePlaceholder';

function Atualizacoes() {
  return (
    <PagePlaceholder
      title="Atualizações"
      subtitle="Controle e visão rápida de atualizações de preço pendentes e concluídas."
      kpis={[
        { label: 'Atualizações pendentes', value: '23' },
        { label: 'Atualizações concluídas', value: '105' }
      ]}
    />
  );
}

export default Atualizacoes;

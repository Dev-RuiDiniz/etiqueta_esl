import PagePlaceholder from '../components/PagePlaceholder';

function Etiquetas() {
  return (
    <PagePlaceholder
      title="Etiquetas"
      subtitle="Acompanhe o status e a disponibilidade das ESL por setor."
      kpis={[
        { label: 'ESL ativas', value: '3.412' },
        { label: 'ESL com bateria baixa', value: '42' }
      ]}
    />
  );
}

export default Etiquetas;

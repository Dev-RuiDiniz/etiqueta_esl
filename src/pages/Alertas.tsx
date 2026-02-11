import PagePlaceholder from '../components/PagePlaceholder';

function Alertas() {
  return (
    <PagePlaceholder
      title="Alertas"
      subtitle="Monitore incidentes e eventos críticos do ambiente ESL."
      kpis={[
        { label: 'Alertas críticos', value: '2' },
        { label: 'Alertas resolvidos hoje', value: '18' }
      ]}
    />
  );
}

export default Alertas;

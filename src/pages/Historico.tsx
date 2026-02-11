import PagePlaceholder from '../components/PagePlaceholder';

function Historico() {
  return (
    <PagePlaceholder
      title="Histórico"
      subtitle="Linha do tempo de eventos e mudanças aplicadas no ecossistema ESL."
      kpis={[
        { label: 'Eventos nas últimas 24h', value: '320' },
        { label: 'Reprocessamentos', value: '4' }
      ]}
    />
  );
}

export default Historico;

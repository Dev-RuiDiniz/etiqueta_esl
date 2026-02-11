import PagePlaceholder from '../components/PagePlaceholder';

function Produtos() {
  return (
    <PagePlaceholder
      title="Produtos"
      subtitle="Resumo dos produtos vinculados às etiquetas eletrônicas."
      kpis={[
        { label: 'Produtos com etiqueta eletrônica', value: '2.189' },
        { label: 'Produtos sem vínculo', value: '15' }
      ]}
    />
  );
}

export default Produtos;

import { useState } from 'react';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import LoadingState from '../components/common/LoadingState';
import useAsync from '../hooks/useAsync';
import { eslGet, eslPost } from '../services/esl/apiClient';
import { formatCurrencyBRL } from '../utils/format';

type Product = {
  product_code: string;
  product_name: string;
  price: number;
  quantity: number | null;
  last_synced_at: string;
  sync_status: string;
};

type Binding = {
  esl_code: string;
  product_code: string;
  binding_status: string;
  bound_at: string;
};

type ProductsResponse = {
  products: Product[];
  total: number;
  page: number;
  size: number;
};

async function fetchProducts(page: number, size: number) {
  const result = await eslGet<ProductsResponse>(`/products?page=${page}&size=${size}`);
  return result.data as ProductsResponse;
}

async function fetchBindingsByProduct(productCode: string) {
  const result = await eslGet<Binding[]>(`/bindings?product_code=${encodeURIComponent(productCode)}`);
  return Array.isArray(result.data) ? result.data : [];
}

type UpsertForm = { product_code: string; product_name: string; price: string };
const emptyForm: UpsertForm = { product_code: '', product_name: '', price: '' };

function Produtos() {
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const {
    data,
    loading,
    error,
    run: reload
  } = useAsync(() => fetchProducts(page, pageSize), [page]);

  const products = data?.products ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const [form, setForm] = useState<UpsertForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [expandedCode, setExpandedCode] = useState<string | null>(null);
  const [bindings, setBindings] = useState<Binding[]>([]);
  const [loadingBindings, setLoadingBindings] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const price = Number(form.price.replace(',', '.'));
    if (!form.product_code.trim() || !form.product_name.trim() || !Number.isFinite(price) || price <= 0) {
      setSubmitMsg({ ok: false, text: 'Preencha todos os campos corretamente.' });
      return;
    }

    setSubmitting(true);
    setSubmitMsg(null);
    try {
      const result = await eslPost<unknown, object>('/products/upsert', {
        product_code: form.product_code.trim(),
        product_name: form.product_name.trim(),
        price
      });
      if (result.success) {
        setSubmitMsg({ ok: true, text: 'Produto enviado com sucesso.' });
        setForm(emptyForm);
        await reload();
      } else {
        setSubmitMsg({ ok: false, text: result.error_msg || 'Erro ao enviar produto.' });
      }
    } catch {
      setSubmitMsg({ ok: false, text: 'Erro de comunicação com o servidor.' });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleBindings = async (code: string) => {
    if (expandedCode === code) {
      setExpandedCode(null);
      setBindings([]);
      return;
    }
    setExpandedCode(code);
    setLoadingBindings(true);
    try {
      const rows = await fetchBindingsByProduct(code);
      setBindings(rows);
    } finally {
      setLoadingBindings(false);
    }
  };

  return (
    <div className="container-fluid px-0">
      <header className="mb-4">
        <h1 className="h3 mb-1">Produtos</h1>
        <p className="text-muted mb-0">Catálogo de produtos sincronizados com as etiquetas eletrônicas.</p>
      </header>

      {/* Formulário de upsert individual */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <h2 className="h5 mb-3">Cadastrar / atualizar produto</h2>
          <form onSubmit={(e) => void handleSubmit(e)}>
            <div className="row g-3">
              <div className="col-12 col-md-4">
                <label htmlFor="prod-code" className="form-label">Código do produto</label>
                <input
                  id="prod-code"
                  className="form-control"
                  value={form.product_code}
                  onChange={(e) => setForm((f) => ({ ...f, product_code: e.target.value }))}
                  placeholder="Ex: SKU-001"
                  required
                />
              </div>
              <div className="col-12 col-md-4">
                <label htmlFor="prod-name" className="form-label">Nome do produto</label>
                <input
                  id="prod-name"
                  className="form-control"
                  value={form.product_name}
                  onChange={(e) => setForm((f) => ({ ...f, product_name: e.target.value }))}
                  placeholder="Ex: Arroz Integral 1kg"
                  required
                />
              </div>
              <div className="col-12 col-md-2">
                <label htmlFor="prod-price" className="form-label">Preço (R$)</label>
                <input
                  id="prod-price"
                  className="form-control"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  placeholder="Ex: 12,90"
                  required
                />
              </div>
              <div className="col-12 col-md-2 d-grid align-items-end">
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? (
                    <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />Enviando...</>
                  ) : 'Enviar'}
                </button>
              </div>
            </div>
            {submitMsg ? (
              <div className={`alert mt-3 mb-0 ${submitMsg.ok ? 'alert-success' : 'alert-danger'}`} role="alert">
                {submitMsg.text}
              </div>
            ) : null}
          </form>
        </div>
      </div>

      {/* Tabela de produtos */}
      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h2 className="h5 mb-0">Catálogo ({total} produto{total !== 1 ? 's' : ''})</h2>
            <button className="btn btn-outline-secondary btn-sm" onClick={() => void reload()}>
              Atualizar
            </button>
          </div>

          {error ? (
            <ErrorState
              title="Não foi possível carregar os produtos"
              message="Verifique a conexão e tente novamente."
              onRetry={() => void reload()}
            />
          ) : loading ? (
            <LoadingState variant="skeleton" lines={6} />
          ) : products.length === 0 ? (
            <EmptyState
              title="Nenhum produto cadastrado"
              description="Use o formulário acima para adicionar o primeiro produto."
            />
          ) : (
            <>
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Código</th>
                      <th>Nome</th>
                      <th>Preço</th>
                      <th>Qtd.</th>
                      <th>Status</th>
                      <th>Última sinc.</th>
                      <th>Etiquetas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => (
                      <>
                        <tr key={p.product_code}>
                          <td><code>{p.product_code}</code></td>
                          <td>{p.product_name}</td>
                          <td>{formatCurrencyBRL(p.price)}</td>
                          <td>{p.quantity ?? '—'}</td>
                          <td>
                            <span className={`badge ${p.sync_status === 'SYNCED' ? 'bg-success' : 'bg-warning text-dark'}`}>
                              {p.sync_status}
                            </span>
                          </td>
                          <td>
                            <small className="text-muted">
                              {new Date(p.last_synced_at).toLocaleString('pt-BR')}
                            </small>
                          </td>
                          <td>
                            <button
                              className="btn btn-link btn-sm p-0"
                              onClick={() => void toggleBindings(p.product_code)}
                            >
                              {expandedCode === p.product_code ? 'Ocultar' : 'Ver vínculos'}
                            </button>
                          </td>
                        </tr>
                        {expandedCode === p.product_code ? (
                          <tr key={`${p.product_code}-bindings`}>
                            <td colSpan={7} className="bg-light">
                              {loadingBindings ? (
                                <span className="text-muted small">Carregando vínculos...</span>
                              ) : bindings.length === 0 ? (
                                <span className="text-muted small">Nenhuma etiqueta vinculada.</span>
                              ) : (
                                <ul className="mb-0 list-unstyled small">
                                  {bindings.map((b) => (
                                    <li key={b.esl_code}>
                                      <code>{b.esl_code}</code>
                                      <span className={`ms-2 badge ${b.binding_status === 'BOUND' ? 'bg-success' : 'bg-secondary'}`}>
                                        {b.binding_status}
                                      </span>
                                      <span className="ms-2 text-muted">
                                        desde {new Date(b.bound_at).toLocaleDateString('pt-BR')}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </td>
                          </tr>
                        ) : null}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginação */}
              {totalPages > 1 ? (
                <nav aria-label="Navegação de páginas de produtos">
                  <ul className="pagination justify-content-center mb-0">
                    <li className={`page-item ${page <= 1 ? 'disabled' : ''}`}>
                      <button className="page-link" onClick={() => setPage((p) => Math.max(1, p - 1))}>
                        Anterior
                      </button>
                    </li>
                    <li className="page-item disabled">
                      <span className="page-link">
                        {page} / {totalPages}
                      </span>
                    </li>
                    <li className={`page-item ${page >= totalPages ? 'disabled' : ''}`}>
                      <button className="page-link" onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                        Próxima
                      </button>
                    </li>
                  </ul>
                </nav>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Produtos;

import { Fragment, useState } from 'react';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import LoadingState from '../components/common/LoadingState';
import useAsync from '../hooks/useAsync';
import { eslDelete, eslGet, eslPost } from '../services/esl/apiClient';
import type { EslProductUpsertInput } from '../types/esl';
import { formatCurrencyBRL } from '../utils/format';

type Product = {
  product_inner_code?: string | null;
  product_code: string;
  product_name: string;
  spec?: string | null;
  grade?: string | null;
  unit?: string | null;
  price: number;
  vip_price?: number | null;
  origin_price?: number | null;
  origin?: string | null;
  manufacturer?: string | null;
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

type UpsertForm = {
  product_inner_code: string;
  product_code: string;
  product_name: string;
  spec: string;
  grade: string;
  unit: string;
  price: string;
  vip_price: string;
  origin_price: string;
  origin: string;
  manufacturer: string;
};

const emptyForm: UpsertForm = {
  product_inner_code: '',
  product_code: '',
  product_name: '',
  spec: '',
  grade: '',
  unit: '',
  price: '',
  vip_price: '',
  origin_price: '',
  origin: '',
  manufacturer: ''
};

function parseOptionalNumber(value: string) {
  const normalized = value.trim().replace(',', '.');
  if (!normalized) {
    return undefined;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function isValidNumber(value: number | undefined): value is number {
  return Number.isFinite(value);
}

function toForm(product: Product): UpsertForm {
  return {
    product_inner_code: product.product_inner_code ?? '',
    product_code: product.product_code ?? '',
    product_name: product.product_name ?? '',
    spec: product.spec ?? '',
    grade: product.grade ?? '',
    unit: product.unit ?? '',
    price: product.price != null ? String(product.price) : '',
    vip_price: product.vip_price != null ? String(product.vip_price) : '',
    origin_price: product.origin_price != null ? String(product.origin_price) : '',
    origin: product.origin ?? '',
    manufacturer: product.manufacturer ?? ''
  };
}

function textOrDash(value: string | null | undefined) {
  const normalized = String(value ?? '').trim();
  return normalized || '—';
}

async function fetchProducts(page: number, size: number) {
  const result = await eslGet<ProductsResponse>(`/products?page=${page}&size=${size}`);
  return result.data as ProductsResponse;
}

async function fetchBindingsByProduct(productCode: string) {
  const result = await eslGet<Binding[]>(`/bindings?product_code=${encodeURIComponent(productCode)}`);
  return Array.isArray(result.data) ? result.data : [];
}

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
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingCode, setDeletingCode] = useState<string | null>(null);
  const [submitMsg, setSubmitMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [expandedCode, setExpandedCode] = useState<string | null>(null);
  const [bindings, setBindings] = useState<Binding[]>([]);
  const [loadingBindings, setLoadingBindings] = useState(false);

  const handleChange = (field: keyof UpsertForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingCode(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const price = parseOptionalNumber(form.price);
    const vipPrice = parseOptionalNumber(form.vip_price);
    const originPrice = parseOptionalNumber(form.origin_price);

    if (!form.product_code.trim() || !form.product_name.trim() || !isValidNumber(price) || price <= 0) {
      setSubmitMsg({ ok: false, text: 'Preencha corretamente os campos obrigatórios código de barras, nome do produto e preço.' });
      return;
    }

    if ((form.vip_price.trim() && !isValidNumber(vipPrice)) || (form.origin_price.trim() && !isValidNumber(originPrice))) {
      setSubmitMsg({ ok: false, text: 'Confira os campos numéricos opcionais antes de salvar.' });
      return;
    }

    setSubmitting(true);
    setSubmitMsg(null);

    try {
      const payload: EslProductUpsertInput = {
        product_inner_code: form.product_inner_code.trim() || undefined,
        product_code: form.product_code.trim(),
        product_name: form.product_name.trim(),
        spec: form.spec.trim() || undefined,
        grade: form.grade.trim() || undefined,
        unit: form.unit.trim() || undefined,
        price,
        vip_price: form.vip_price.trim() ? vipPrice : undefined,
        origin_price: form.origin_price.trim() ? originPrice : undefined,
        origin: form.origin.trim() || undefined,
        manufacturer: form.manufacturer.trim() || undefined
      };

      const result = await eslPost<unknown, EslProductUpsertInput>('/products/upsert', payload);
      if (!result.success) {
        setSubmitMsg({ ok: false, text: result.error_msg || 'Erro ao salvar produto.' });
        return;
      }

      setSubmitMsg({ ok: true, text: editingCode ? 'Produto atualizado com sucesso.' : 'Produto cadastrado com sucesso.' });
      resetForm();
      await reload();
    } catch (err) {
      setSubmitMsg({ ok: false, text: err instanceof Error ? err.message : 'Erro de comunicação com o servidor.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (product: Product) => {
    setForm(toForm(product));
    setEditingCode(product.product_code);
    setSubmitMsg(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (product: Product) => {
    const confirmed = window.confirm(`Apagar o produto ${product.product_name} (${product.product_code}) do catálogo?`);
    if (!confirmed) {
      return;
    }

    setDeletingCode(product.product_code);
    setSubmitMsg(null);

    try {
      await eslDelete(`/products/${encodeURIComponent(product.product_code)}`);
      if (expandedCode === product.product_code) {
        setExpandedCode(null);
        setBindings([]);
      }
      if (editingCode === product.product_code) {
        resetForm();
      }
      setSubmitMsg({ ok: true, text: 'Produto apagado com sucesso.' });
      await reload();
    } catch (err) {
      setSubmitMsg({ ok: false, text: err instanceof Error ? err.message : 'Não foi possível apagar o produto.' });
    } finally {
      setDeletingCode(null);
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
      <header className="page-header mb-4">
        <span className="eyebrow">LiveLabel</span>
        <h1 className="h3 mb-1">Catálogo operacional</h1>
        <p className="text-muted mb-0">Produtos preparados para sincronização confiável com a malha LiveLabel e seus templates digitais.</p>
      </header>

      <div className="card border-0 shadow-sm mb-4 app-surface">
        <div className="card-body">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
            <h2 className="h5 mb-0">{editingCode ? 'Atualizar produto' : 'Cadastrar produto'}</h2>
            {editingCode ? (
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={resetForm}>
                Cancelar edição
              </button>
            ) : null}
          </div>

          <form onSubmit={(e) => void handleSubmit(e)}>
            <div className="row g-3">
              <div className="col-12 col-md-4">
                <label htmlFor="prod-inner-code" className="form-label">Código interno (#pi)</label>
                <input
                  id="prod-inner-code"
                  className="form-control"
                  value={form.product_inner_code}
                  onChange={(e) => handleChange('product_inner_code', e.target.value)}
                  placeholder="Código interno do ERP"
                />
              </div>
              <div className="col-12 col-md-4">
                <label htmlFor="prod-code" className="form-label">Código de barras (#pc)</label>
                <input
                  id="prod-code"
                  className="form-control"
                  value={form.product_code}
                  onChange={(e) => handleChange('product_code', e.target.value)}
                  placeholder="7894900011517"
                  required
                />
              </div>
              <div className="col-12 col-md-4">
                <label htmlFor="prod-name" className="form-label">Nome do produto (#pn)</label>
                <input
                  id="prod-name"
                  className="form-control"
                  value={form.product_name}
                  onChange={(e) => handleChange('product_name', e.target.value)}
                  placeholder="Arroz Tipo 1 5kg"
                  required
                />
              </div>
              <div className="col-12 col-md-4">
                <label htmlFor="prod-spec" className="form-label">Especificação (#ps)</label>
                <input
                  id="prod-spec"
                  className="form-control"
                  value={form.spec}
                  onChange={(e) => handleChange('spec', e.target.value)}
                  placeholder="Pacote 5kg"
                />
              </div>
              <div className="col-12 col-md-4">
                <label htmlFor="prod-grade" className="form-label">Grade (#pg)</label>
                <input
                  id="prod-grade"
                  className="form-control"
                  value={form.grade}
                  onChange={(e) => handleChange('grade', e.target.value)}
                  placeholder="Linha, grade ou variação"
                />
              </div>
              <div className="col-12 col-md-4">
                <label htmlFor="prod-unit" className="form-label">Unidade (#pu)</label>
                <input
                  id="prod-unit"
                  className="form-control"
                  value={form.unit}
                  onChange={(e) => handleChange('unit', e.target.value)}
                  placeholder="un"
                />
              </div>
              <div className="col-12 col-md-4">
                <label htmlFor="prod-price" className="form-label">Preço (#pp)</label>
                <input
                  id="prod-price"
                  className="form-control"
                  value={form.price}
                  onChange={(e) => handleChange('price', e.target.value)}
                  placeholder="27.49"
                  required
                />
              </div>
              <div className="col-12 col-md-4">
                <label htmlFor="prod-vip-price" className="form-label">Preço promocional (#vp)</label>
                <input
                  id="prod-vip-price"
                  className="form-control"
                  value={form.vip_price}
                  onChange={(e) => handleChange('vip_price', e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="col-12 col-md-4">
                <label htmlFor="prod-origin-price" className="form-label">Preço de origem (#pop)</label>
                <input
                  id="prod-origin-price"
                  className="form-control"
                  value={form.origin_price}
                  onChange={(e) => handleChange('origin_price', e.target.value)}
                  placeholder="31.99"
                />
              </div>
              <div className="col-12 col-md-6">
                <label htmlFor="prod-origin" className="form-label">Origem (#po)</label>
                <input
                  id="prod-origin"
                  className="form-control"
                  value={form.origin}
                  onChange={(e) => handleChange('origin', e.target.value)}
                  placeholder="Brasil"
                />
              </div>
              <div className="col-12 col-md-6">
                <label htmlFor="prod-manufacturer" className="form-label">Fabricante (#pm)</label>
                <input
                  id="prod-manufacturer"
                  className="form-control"
                  value={form.manufacturer}
                  onChange={(e) => handleChange('manufacturer', e.target.value)}
                  placeholder="Graos do Sul"
                />
              </div>
              <div className="col-12 d-flex flex-wrap gap-2">
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? (
                    <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />Salvando...</>
                  ) : editingCode ? 'Atualizar produto' : 'Cadastrar produto'}
                </button>
                {editingCode ? (
                  <button type="button" className="btn btn-outline-secondary" onClick={resetForm}>
                    Limpar formulário
                  </button>
                ) : null}
              </div>
            </div>

            {submitMsg ? (
              <div className={`mt-3 mb-0 ${submitMsg.ok ? 'app-alert app-alert--success' : 'app-alert app-alert--danger'}`} role="alert">
                {submitMsg.text}
              </div>
            ) : null}
          </form>
        </div>
      </div>

      <div className="card border-0 shadow-sm app-surface">
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
                <table className="table table-hover align-middle admin-table">
                  <thead>
                    <tr>
                      <th>Código interno (#pi)</th>
                      <th>Código de barras (#pc)</th>
                      <th>Produto (#pn)</th>
                      <th>Especificação (#ps)</th>
                      <th>Grade (#pg)</th>
                      <th>Unidade (#pu)</th>
                      <th>Preço (#pp)</th>
                      <th>Promo (#vp)</th>
                      <th>Origem preço (#pop)</th>
                      <th>Origem (#po)</th>
                      <th>Fabricante (#pm)</th>
                      <th>Qtd.</th>
                      <th>Status</th>
                      <th>Última sinc.</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <Fragment key={product.product_code}>
                        <tr>
                          <td>{textOrDash(product.product_inner_code)}</td>
                          <td><code>{product.product_code}</code></td>
                          <td>{product.product_name}</td>
                          <td>{textOrDash(product.spec)}</td>
                          <td>{textOrDash(product.grade)}</td>
                          <td>{textOrDash(product.unit)}</td>
                          <td>{formatCurrencyBRL(product.price)}</td>
                          <td>{product.vip_price != null ? formatCurrencyBRL(product.vip_price) : '—'}</td>
                          <td>{product.origin_price != null ? formatCurrencyBRL(product.origin_price) : '—'}</td>
                          <td>{textOrDash(product.origin)}</td>
                          <td>{textOrDash(product.manufacturer)}</td>
                          <td>{product.quantity ?? '—'}</td>
                          <td>
                            <span className={`badge ${product.sync_status === 'SYNCED' ? 'bg-success' : 'bg-warning text-dark'}`}>
                              {product.sync_status}
                            </span>
                          </td>
                          <td>
                            <small className="text-muted">
                              {new Date(product.last_synced_at).toLocaleString('pt-BR')}
                            </small>
                          </td>
                          <td>
                            <div className="d-flex flex-wrap gap-2">
                              <button
                                type="button"
                                className="btn btn-outline-primary btn-sm"
                                onClick={() => handleEdit(product)}
                              >
                                Editar
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline-danger btn-sm"
                                onClick={() => void handleDelete(product)}
                                disabled={deletingCode === product.product_code}
                              >
                                {deletingCode === product.product_code ? 'Apagando...' : 'Apagar'}
                              </button>
                              <button
                                type="button"
                                className="btn btn-link btn-sm p-0 align-self-center"
                                onClick={() => void toggleBindings(product.product_code)}
                              >
                                {expandedCode === product.product_code ? 'Ocultar vínculos' : 'Ver vínculos'}
                              </button>
                            </div>
                          </td>
                        </tr>
                        {expandedCode === product.product_code ? (
                          <tr>
                            <td colSpan={15} className="table-inline-panel">
                              {loadingBindings ? (
                                <span className="text-muted small">Carregando vínculos...</span>
                              ) : bindings.length === 0 ? (
                                <span className="text-muted small">Nenhum ativo vinculado.</span>
                              ) : (
                                <ul className="mb-0 list-unstyled small">
                                  {bindings.map((binding) => (
                                    <li key={binding.esl_code}>
                                      <code>{binding.esl_code}</code>
                                      <span className={`ms-2 badge ${binding.binding_status === 'BOUND' ? 'bg-success' : 'bg-secondary'}`}>
                                        {binding.binding_status}
                                      </span>
                                      <span className="ms-2 text-muted">
                                        desde {new Date(binding.bound_at).toLocaleDateString('pt-BR')}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 ? (
                <nav aria-label="Navegação de páginas de produtos">
                  <ul className="pagination justify-content-center mb-0">
                    <li className={`page-item ${page <= 1 ? 'disabled' : ''}`}>
                      <button className="page-link" onClick={() => setPage((current) => Math.max(1, current - 1))}>
                        Anterior
                      </button>
                    </li>
                    <li className="page-item disabled">
                      <span className="page-link">
                        {page} / {totalPages}
                      </span>
                    </li>
                    <li className={`page-item ${page >= totalPages ? 'disabled' : ''}`}>
                      <button className="page-link" onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>
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

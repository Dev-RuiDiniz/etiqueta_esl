import { useEffect, useMemo, useState } from 'react';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import LoadingState from '../components/common/LoadingState';
import useAsync from '../hooks/useAsync';
import {
  bindCatalogItem,
  createCatalogItem,
  importCatalogFromVendor,
  listCatalog,
  searchCatalogItem,
  unbindCatalogItem,
  updateCatalogItem
} from '../services/esl/catalogService';
import { listProducts } from '../services/esl/productService';
import { queryTemplates } from '../services/esl/templateService';
import type { EslCatalogItem, EslProductListItem, EslTemplateSummary } from '../types/esl';

type FlashMessage = {
  ok: boolean;
  text: string;
};

const emptyCreateForm = {
  esl_code: '',
  display_name: ''
};

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return '—';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString('pt-BR');
}

function formatBattery(item: EslCatalogItem) {
  if (item.snapshot?.battery_percent != null) {
    return `${item.snapshot.battery_percent}%`;
  }

  if (item.snapshot?.esl_battery != null) {
    return String(item.snapshot.esl_battery);
  }

  return '—';
}

function statusBadgeClass(item: EslCatalogItem) {
  if (!item.snapshot) {
    return 'bg-secondary';
  }

  return item.snapshot.online === 1 ? 'bg-success' : 'bg-danger';
}

function statusLabel(item: EslCatalogItem) {
  if (!item.snapshot) {
    return 'Sem status';
  }

  return item.snapshot.online === 1 ? 'ONLINE' : 'OFFLINE';
}

function Etiquetas() {
  const {
    data: catalogData,
    loading,
    error,
    run: reloadCatalog
  } = useAsync(async () => {
    const result = await listCatalog();
    return result.data ?? [];
  }, []);

  const { data: productsData, run: reloadProducts } = useAsync(async () => {
    const result = await listProducts(1, 200);
    return result.data?.products ?? [];
  }, []);

  const { data: templatesData, run: reloadTemplates } = useAsync(async () => {
    const result = await queryTemplates(1, 200, true);
    return result.data ?? [];
  }, []);

  const catalogItems = useMemo(() => catalogData ?? [], [catalogData]);
  const products = useMemo<EslProductListItem[]>(() => productsData ?? [], [productsData]);
  const templates = useMemo<EslTemplateSummary[]>(() => templatesData ?? [], [templatesData]);

  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [flash, setFlash] = useState<FlashMessage | null>(null);
  const [activeBindCode, setActiveBindCode] = useState<string>('');
  const [activeEditCode, setActiveEditCode] = useState<string>('');
  const [bindForm, setBindForm] = useState<{ product_code: string; template_id: string }>({ product_code: '', template_id: '' });
  const [editForm, setEditForm] = useState<{ display_name: string; esltype_code: string; ap_code: string }>({
    display_name: '',
    esltype_code: '',
    ap_code: ''
  });
  const [rowBusyCode, setRowBusyCode] = useState<string>('');

  useEffect(() => {
    if (!activeEditCode) {
      return;
    }

    const item = catalogItems.find((entry) => entry.esl_code === activeEditCode);
    if (!item) {
      return;
    }

    setEditForm({
      display_name: item.display_name ?? '',
      esltype_code: item.esltype_code ?? '',
      ap_code: item.ap_code ?? ''
    });
  }, [activeEditCode, catalogItems]);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!createForm.esl_code.trim()) {
      setFlash({ ok: false, text: 'Informe o código da etiqueta.' });
      return;
    }

    setCreateSubmitting(true);
    setFlash(null);
    try {
      await createCatalogItem({
        esl_code: createForm.esl_code.trim(),
        display_name: createForm.display_name.trim() || undefined
      });
      setCreateForm(emptyCreateForm);
      setFlash({ ok: true, text: 'Etiqueta cadastrada com sucesso.' });
      await reloadCatalog();
    } catch (err) {
      setFlash({ ok: false, text: err instanceof Error ? err.message : 'Falha ao cadastrar etiqueta.' });
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleImport = async () => {
    setImporting(true);
    setFlash(null);
    try {
      const result = await importCatalogFromVendor(100);
      setFlash({
        ok: true,
        text: `Importação concluída. ${result.data?.imported_count ?? 0} etiqueta(s) reconciliada(s).`
      });
      await reloadCatalog();
    } catch (err) {
      setFlash({ ok: false, text: err instanceof Error ? err.message : 'Falha ao importar etiquetas.' });
    } finally {
      setImporting(false);
    }
  };

  const handleBind = async (eslCode: string) => {
    if (!bindForm.product_code) {
      setFlash({ ok: false, text: 'Selecione um produto para vincular.' });
      return;
    }

    setRowBusyCode(eslCode);
    setFlash(null);
    try {
      await bindCatalogItem(eslCode, {
        product_code: bindForm.product_code,
        template_id: bindForm.template_id ? Number(bindForm.template_id) : null
      });
      setActiveBindCode('');
      setBindForm({ product_code: '', template_id: '' });
      setFlash({ ok: true, text: `Produto vinculado à etiqueta ${eslCode}.` });
      await reloadCatalog();
    } catch (err) {
      setFlash({ ok: false, text: err instanceof Error ? err.message : 'Falha ao vincular produto.' });
    } finally {
      setRowBusyCode('');
    }
  };

  const handleUnbind = async (eslCode: string) => {
    setRowBusyCode(eslCode);
    setFlash(null);
    try {
      await unbindCatalogItem(eslCode);
      setFlash({ ok: true, text: `Vínculo removido da etiqueta ${eslCode}.` });
      await reloadCatalog();
    } catch (err) {
      setFlash({ ok: false, text: err instanceof Error ? err.message : 'Falha ao desvincular etiqueta.' });
    } finally {
      setRowBusyCode('');
    }
  };

  const handleSearch = async (eslCode: string) => {
    setRowBusyCode(eslCode);
    setFlash(null);
    try {
      await searchCatalogItem(eslCode);
      setFlash({ ok: true, text: `Comando de LED enviado para ${eslCode}.` });
    } catch (err) {
      setFlash({ ok: false, text: err instanceof Error ? err.message : 'Falha ao localizar etiqueta.' });
    } finally {
      setRowBusyCode('');
    }
  };

  const handleSaveEdit = async (eslCode: string) => {
    setRowBusyCode(eslCode);
    setFlash(null);
    try {
      await updateCatalogItem(eslCode, {
        display_name: editForm.display_name.trim() || null,
        esltype_code: editForm.esltype_code.trim() || null,
        ap_code: editForm.ap_code.trim() || null
      });
      setActiveEditCode('');
      setFlash({ ok: true, text: `Etiqueta ${eslCode} atualizada.` });
      await reloadCatalog();
    } catch (err) {
      setFlash({ ok: false, text: err instanceof Error ? err.message : 'Falha ao atualizar etiqueta.' });
    } finally {
      setRowBusyCode('');
    }
  };

  return (
    <div className="container-fluid px-0">
      <header className="mb-4">
        <h1 className="h3 mb-1">Etiquetas</h1>
        <p className="text-muted mb-0">Central operacional para cadastrar ESL, importar do vendor, editar dados locais e vincular produtos.</p>
      </header>

      <div className="row g-4 mb-4">
        <div className="col-12 col-xl-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <h2 className="h5 mb-3">Cadastrar ESL</h2>
              <form onSubmit={(event) => void handleCreate(event)}>
                <div className="mb-3">
                  <label htmlFor="catalog-esl-code" className="form-label">Código da etiqueta</label>
                  <input
                    id="catalog-esl-code"
                    className="form-control"
                    value={createForm.esl_code}
                    onChange={(event) => setCreateForm((current) => ({ ...current, esl_code: event.target.value }))}
                    placeholder="Ex: 1437a0a0"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="catalog-display-name" className="form-label">Nome local</label>
                  <input
                    id="catalog-display-name"
                    className="form-control"
                    value={createForm.display_name}
                    onChange={(event) => setCreateForm((current) => ({ ...current, display_name: event.target.value }))}
                    placeholder="Ex: Gôndola 2 ponta"
                  />
                </div>
                <button type="submit" className="btn btn-primary w-100" disabled={createSubmitting}>
                  {createSubmitting ? 'Salvando...' : 'Cadastrar etiqueta'}
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body d-flex flex-column">
              <h2 className="h5 mb-3">Importar do vendor</h2>
              <p className="text-muted mb-4">Busca etiquetas já descobertas na base station/cloud com `esl/query` e reconcilia no catálogo local.</p>
              <button type="button" className="btn btn-outline-primary mt-auto" onClick={() => void handleImport()} disabled={importing}>
                {importing ? 'Importando...' : 'Importar etiquetas'}
              </button>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <h2 className="h5 mb-3">Resumo</h2>
              <div className="d-flex justify-content-between py-2 border-bottom">
                <span className="text-muted">Etiquetas cadastradas</span>
                <strong>{catalogItems.length}</strong>
              </div>
              <div className="d-flex justify-content-between py-2 border-bottom">
                <span className="text-muted">Produtos disponíveis</span>
                <strong>{products.length}</strong>
              </div>
              <div className="d-flex justify-content-between py-2">
                <span className="text-muted">Templates carregados</span>
                <strong>{templates.length}</strong>
              </div>
              <button
                type="button"
                className="btn btn-outline-secondary w-100 mt-3"
                onClick={() => {
                  void reloadCatalog();
                  void reloadProducts();
                  void reloadTemplates();
                }}
              >
                Atualizar dados
              </button>
            </div>
          </div>
        </div>
      </div>

      {flash ? (
        <div className={`alert ${flash.ok ? 'alert-success' : 'alert-danger'}`} role="alert">
          {flash.text}
        </div>
      ) : null}

      {error ? (
        <ErrorState
          title="Não foi possível carregar o catálogo de etiquetas"
          message="Verifique a conexão com o BFF e tente novamente."
          onRetry={() => void reloadCatalog()}
        />
      ) : loading ? (
        <LoadingState variant="skeleton" lines={8} />
      ) : catalogItems.length === 0 ? (
        <EmptyState
          title="Nenhuma etiqueta cadastrada"
          description="Cadastre manualmente a primeira ESL ou importe as etiquetas descobertas no vendor."
          action={
            <button className="btn btn-outline-primary" type="button" onClick={() => void handleImport()}>
              Importar do vendor
            </button>
          }
        />
      ) : (
        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>ESL</th>
                    <th>Cadastro</th>
                    <th>Produto</th>
                    <th>Status</th>
                    <th>Bateria</th>
                    <th>AP / Tipo</th>
                    <th>Origem</th>
                    <th>Última leitura</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {catalogItems.map((item) => (
                    <tr key={item.esl_code}>
                      <td>
                        <div className="fw-semibold"><code>{item.esl_code}</code></div>
                        <small className="text-muted">{item.display_name ?? 'Sem nome local'}</small>
                      </td>
                      <td>
                        <span className="badge bg-info text-dark">{item.registration_status}</span>
                      </td>
                      <td>
                        {item.binding ? (
                          <>
                            <div className="fw-semibold">{item.binding.product_code}</div>
                            <small className="text-muted">Template: {item.binding.template_id ?? '—'}</small>
                          </>
                        ) : (
                          <span className="text-muted">Sem vínculo</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${statusBadgeClass(item)}`}>{statusLabel(item)}</span>
                      </td>
                      <td>{formatBattery(item)}</td>
                      <td>
                        <div>{item.ap_code ?? item.snapshot?.ap_code ?? '—'}</div>
                        <small className="text-muted">{item.esltype_code ?? item.snapshot?.esltype_code ?? 'Tipo desconhecido'}</small>
                      </td>
                      <td>{item.source}</td>
                      <td>{formatDateTime(item.last_seen_at ?? item.snapshot?.seen_at ?? item.snapshot?.updated_at)}</td>
                      <td>
                        <div className="d-flex flex-wrap gap-2">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => {
                              setActiveBindCode(activeBindCode === item.esl_code ? '' : item.esl_code);
                              setActiveEditCode('');
                              setBindForm({
                                product_code: item.binding?.product_code ?? '',
                                template_id: item.binding?.template_id != null ? String(item.binding.template_id) : ''
                              });
                            }}
                          >
                            {activeBindCode === item.esl_code ? 'Fechar vínculo' : 'Vincular produto'}
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => {
                              setActiveEditCode(activeEditCode === item.esl_code ? '' : item.esl_code);
                              setActiveBindCode('');
                            }}
                          >
                            {activeEditCode === item.esl_code ? 'Fechar edição' : 'Editar'}
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-dark"
                            onClick={() => void handleSearch(item.esl_code)}
                            disabled={rowBusyCode === item.esl_code}
                          >
                            Localizar
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => void handleUnbind(item.esl_code)}
                            disabled={!item.binding || rowBusyCode === item.esl_code}
                          >
                            Desvincular
                          </button>
                        </div>

                        {activeBindCode === item.esl_code ? (
                          <div className="border rounded p-3 mt-3 bg-light">
                            <div className="row g-2">
                              <div className="col-12">
                                <label className="form-label">Produto</label>
                                <select
                                  className="form-select"
                                  value={bindForm.product_code}
                                  onChange={(event) => setBindForm((current) => ({ ...current, product_code: event.target.value }))}
                                >
                                  <option value="">Selecione um produto</option>
                                  {products.map((product) => (
                                    <option key={product.product_code} value={product.product_code}>
                                      {product.product_code} - {product.product_name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="col-12">
                                <label className="form-label">Template</label>
                                <select
                                  className="form-select"
                                  value={bindForm.template_id}
                                  onChange={(event) => setBindForm((current) => ({ ...current, template_id: event.target.value }))}
                                >
                                  <option value="">Sem template fixo</option>
                                  {templates.map((template) => (
                                    <option key={template.id} value={String(template.id)}>
                                      {template.id} - {template.esltemplate_name ?? 'Sem nome'} ({template.esltype_code ?? 'N/A'})
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                            <button
                              type="button"
                              className="btn btn-primary btn-sm mt-3"
                              onClick={() => void handleBind(item.esl_code)}
                              disabled={rowBusyCode === item.esl_code}
                            >
                              Confirmar vínculo
                            </button>
                          </div>
                        ) : null}

                        {activeEditCode === item.esl_code ? (
                          <div className="border rounded p-3 mt-3 bg-light">
                            <div className="row g-2">
                              <div className="col-12">
                                <label className="form-label">Nome local</label>
                                <input
                                  className="form-control"
                                  value={editForm.display_name}
                                  onChange={(event) => setEditForm((current) => ({ ...current, display_name: event.target.value }))}
                                />
                              </div>
                              <div className="col-12 col-md-6">
                                <label className="form-label">Tipo ESL</label>
                                <input
                                  className="form-control"
                                  value={editForm.esltype_code}
                                  onChange={(event) => setEditForm((current) => ({ ...current, esltype_code: event.target.value }))}
                                />
                              </div>
                              <div className="col-12 col-md-6">
                                <label className="form-label">AP</label>
                                <input
                                  className="form-control"
                                  value={editForm.ap_code}
                                  onChange={(event) => setEditForm((current) => ({ ...current, ap_code: event.target.value }))}
                                />
                              </div>
                            </div>
                            <button
                              type="button"
                              className="btn btn-primary btn-sm mt-3"
                              onClick={() => void handleSaveEdit(item.esl_code)}
                              disabled={rowBusyCode === item.esl_code}
                            >
                              Salvar edição
                            </button>
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Etiquetas;

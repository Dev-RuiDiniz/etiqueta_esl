import { useEffect, useMemo, useState } from 'react';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import LoadingState from '../components/common/LoadingState';
import {
  createEmptyTemplatePayloadForm,
  productToTemplatePayload,
  resolveTemplateFieldProfile,
  templateFieldDefinitions,
  type TemplatePayloadForm
} from '../config/templateFields';
import useAsync from '../hooks/useAsync';
import {
  bindCatalogItem,
  createCatalogItem,
  getStationsOverview,
  importCatalogFromVendor,
  searchCatalogItem,
  unbindCatalogItem
} from '../services/esl/catalogService';
import { listProducts } from '../services/esl/productService';
import { directUpdate, triggerRefresh } from '../services/esl/refreshService';
import type { EslProductListItem, EslStationOverview, EslStationTagOverview } from '../types/esl';
import { formatCurrencyBRL, formatDateTimeBR } from '../utils/format';

type FlashMessage = {
  ok: boolean;
  text: string;
};

const emptyCreateForm = {
  esl_code: '',
  display_name: '',
  expected_ap_code: ''
};

function parseOptionalNumber(value: string) {
  if (!value.trim()) {
    return undefined;
  }

  const normalized = Number(value.replace(',', '.'));
  return Number.isFinite(normalized) ? normalized : undefined;
}

function buildDirectProductPayload(product: EslProductListItem, payloadForm: TemplatePayloadForm) {
  const extendRaw = payloadForm.extend.trim();
  let extend: Record<string, string | number | boolean> | undefined;

  if (extendRaw) {
    const parsed = JSON.parse(extendRaw);

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('O campo extend deve ser um JSON de objeto. Ex: {"origem":"ilha"}');
    }

    extend = parsed as Record<string, string | number | boolean>;
  }

  return {
    product_code: payloadForm.product_code.trim() || product.product_code,
    product_name: payloadForm.product_name.trim() || product.product_name,
    price: parseOptionalNumber(payloadForm.price) ?? product.price,
    quantity: parseOptionalNumber(payloadForm.quantity) ?? product.quantity ?? undefined,
    unit: payloadForm.unit.trim() || undefined,
    vip_price: parseOptionalNumber(payloadForm.vip_price),
    origin_price: parseOptionalNumber(payloadForm.origin_price),
    promotion: payloadForm.promotion.trim() || undefined,
    spec: payloadForm.spec.trim() || undefined,
    grade: payloadForm.grade.trim() || undefined,
    origin: payloadForm.origin.trim() || undefined,
    manufacturer: payloadForm.manufacturer.trim() || undefined,
    qrcode: payloadForm.qrcode.trim() || undefined,
    f1: payloadForm.f1.trim() || undefined,
    f2: payloadForm.f2.trim() || undefined,
    f3: payloadForm.f3.trim() || undefined,
    f4: payloadForm.f4.trim() || undefined,
    f5: payloadForm.f5.trim() || undefined,
    f6: payloadForm.f6.trim() || undefined,
    f7: payloadForm.f7.trim() || undefined,
    f8: payloadForm.f8.trim() || undefined,
    f9: payloadForm.f9.trim() || undefined,
    f10: payloadForm.f10.trim() || undefined,
    f11: payloadForm.f11.trim() || undefined,
    f12: payloadForm.f12.trim() || undefined,
    f13: payloadForm.f13.trim() || undefined,
    f14: payloadForm.f14.trim() || undefined,
    f15: payloadForm.f15.trim() || undefined,
    f16: payloadForm.f16.trim() || undefined,
    extend
  };
}

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return '—';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return formatDateTimeBR(parsed.toISOString());
}

function formatBattery(item: EslStationTagOverview) {
  if (item.battery == null || Number.isNaN(item.battery)) {
    return '—';
  }

  return item.snapshot?.battery_percent != null ? `${item.battery}%` : String(item.battery);
}

function statusBadgeClass(item: EslStationTagOverview) {
  if (item.status === 'ONLINE') {
    return 'bg-success';
  }

  if (item.status === 'OFFLINE') {
    return 'bg-danger';
  }

  return 'bg-secondary';
}

function registrationBadgeClass(status: EslStationTagOverview['registration_status']) {
  if (status === 'BOUND') {
    return 'bg-primary';
  }

  if (status === 'REGISTERED') {
    return 'bg-success';
  }

  if (status === 'PENDING_DISCOVERY') {
    return 'bg-warning text-dark';
  }

  return 'bg-secondary';
}

function registrationLabel(status: EslStationTagOverview['registration_status']) {
  if (status === 'PENDING_DISCOVERY') {
    return 'Pendente';
  }

  if (status === 'REGISTERED') {
    return 'Registrada';
  }

  if (status === 'BOUND') {
    return 'Vinculada';
  }

  return status;
}

function stationLabel(stationCode: string) {
  return stationCode === 'UNASSIGNED' ? 'Sem base station' : stationCode;
}

function Etiquetas() {
  const {
    data: overviewData,
    loading,
    error,
    run: reloadOverview
  } = useAsync(async () => {
    const result = await getStationsOverview();
    return result.data;
  }, []);

  const { data: productsData, run: reloadProducts } = useAsync(async () => {
    const result = await listProducts(1, 200);
    return result.data?.products ?? [];
  }, []);

  const stations = useMemo(() => overviewData?.stations ?? [], [overviewData]);
  const totals = overviewData?.totals ?? { stations: 0, tags: 0, online: 0, offline: 0 };
  const products = useMemo<EslProductListItem[]>(() => productsData ?? [], [productsData]);

  const [selectedStationCode, setSelectedStationCode] = useState('');
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [flash, setFlash] = useState<FlashMessage | null>(null);
  const [activeTagCode, setActiveTagCode] = useState('');
  const [bindForm, setBindForm] = useState<{ product_code: string; template_id: string }>({ product_code: '', template_id: '' });
  const [templatePayloadForm, setTemplatePayloadForm] = useState<TemplatePayloadForm>(createEmptyTemplatePayloadForm());
  const [rowBusyCode, setRowBusyCode] = useState('');

  useEffect(() => {
    if (stations.length === 0) {
      setSelectedStationCode('');
      return;
    }

    if (!selectedStationCode || !stations.some((station) => station.station_code === selectedStationCode)) {
      setSelectedStationCode(stations[0].station_code);
    }
  }, [selectedStationCode, stations]);

  const activeStation = useMemo<EslStationOverview | null>(() => {
    if (stations.length === 0) {
      return null;
    }

    return stations.find((station) => station.station_code === selectedStationCode) ?? stations[0];
  }, [selectedStationCode, stations]);

  const activeTags = activeStation?.tags ?? [];

  const productByCode = useMemo(() => new Map(products.map((product) => [product.product_code, product])), [products]);
  const activeTag = useMemo(() => activeTags.find((tag) => tag.esl_code === activeTagCode) ?? null, [activeTagCode, activeTags]);
  const selectedTemplate = useMemo(
    () => activeTag?.compatible_templates.find((template) => String(template.id) === bindForm.template_id) ?? null,
    [activeTag, bindForm.template_id]
  );
  const templateProfile = useMemo(() => resolveTemplateFieldProfile(selectedTemplate), [selectedTemplate]);

  const openControls = (tag: EslStationTagOverview) => {
    setActiveTagCode(activeTagCode === tag.esl_code ? '' : tag.esl_code);
    const selectedProduct = productByCode.get(tag.binding?.product_code ?? '');
    setBindForm({
      product_code: tag.binding?.product_code ?? '',
      template_id: tag.binding?.template_id != null ? String(tag.binding.template_id) : ''
    });
    setTemplatePayloadForm(productToTemplatePayload(selectedProduct));
  };

  const reloadAll = async () => {
    await Promise.all([reloadOverview(), reloadProducts()]);
  };

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
        display_name: createForm.display_name.trim() || undefined,
        expected_ap_code: createForm.expected_ap_code.trim() || undefined
      });
      setCreateForm(emptyCreateForm);
      setFlash({ ok: true, text: 'Etiqueta cadastrada localmente e marcada como pendente de descoberta.' });
      await reloadOverview();
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
      await reloadOverview();
    } catch (err) {
      setFlash({ ok: false, text: err instanceof Error ? err.message : 'Falha ao importar etiquetas.' });
    } finally {
      setImporting(false);
    }
  };

  const handleBind = async (tag: EslStationTagOverview) => {
    if (!bindForm.product_code) {
      setFlash({ ok: false, text: 'Selecione um produto para vincular.' });
      return;
    }

    setRowBusyCode(tag.esl_code);
    setFlash(null);
    try {
      await bindCatalogItem(tag.esl_code, {
        product_code: bindForm.product_code,
        template_id: bindForm.template_id ? Number(bindForm.template_id) : null
      });
      setFlash({ ok: true, text: `Produto vinculado à etiqueta ${tag.esl_code}.` });
      setActiveTagCode('');
      await reloadOverview();
    } catch (err) {
      setFlash({ ok: false, text: err instanceof Error ? err.message : 'Falha ao vincular produto.' });
    } finally {
      setRowBusyCode('');
    }
  };

  const handleDirectUpdate = async (tag: EslStationTagOverview) => {
    if (!bindForm.product_code) {
      setFlash({ ok: false, text: 'Selecione um produto antes de enviar atualização direta.' });
      return;
    }

    const product = productByCode.get(bindForm.product_code);
    if (!product) {
      setFlash({ ok: false, text: 'Produto selecionado não está disponível no catálogo local.' });
      return;
    }

    setRowBusyCode(tag.esl_code);
    setFlash(null);
    try {
      await directUpdate([
        {
          esl_code: tag.esl_code,
          template_id: bindForm.template_id ? Number(bindForm.template_id) : undefined,
          product: buildDirectProductPayload(product, templatePayloadForm)
        }
      ]);
      setFlash({ ok: true, text: `Template aplicado na etiqueta ${tag.esl_code} com os campos preenchidos.` });
      await reloadOverview();
    } catch (err) {
      setFlash({ ok: false, text: err instanceof Error ? err.message : 'Falha ao enviar atualização direta.' });
    } finally {
      setRowBusyCode('');
    }
  };

  const handleUnbind = async (tag: EslStationTagOverview) => {
    setRowBusyCode(tag.esl_code);
    setFlash(null);
    try {
      await unbindCatalogItem(tag.esl_code);
      setFlash({ ok: true, text: `Vínculo removido da etiqueta ${tag.esl_code}.` });
      await reloadOverview();
    } catch (err) {
      setFlash({ ok: false, text: err instanceof Error ? err.message : 'Falha ao desvincular etiqueta.' });
    } finally {
      setRowBusyCode('');
    }
  };

  const handleSearch = async (tag: EslStationTagOverview) => {
    setRowBusyCode(tag.esl_code);
    setFlash(null);
    try {
      await searchCatalogItem(tag.esl_code);
      setFlash({ ok: true, text: `Comando de LED enviado para ${tag.esl_code}.` });
    } catch (err) {
      setFlash({ ok: false, text: err instanceof Error ? err.message : 'Falha ao localizar etiqueta.' });
    } finally {
      setRowBusyCode('');
    }
  };

  const handleRefresh = async (tag: EslStationTagOverview) => {
    setRowBusyCode(tag.esl_code);
    setFlash(null);
    try {
      await triggerRefresh({ esl_codes: [tag.esl_code] });
      setFlash({ ok: true, text: `Refresh disparado para ${tag.esl_code}.` });
    } catch (err) {
      setFlash({ ok: false, text: err instanceof Error ? err.message : 'Falha ao disparar refresh.' });
    } finally {
      setRowBusyCode('');
    }
  };

  return (
    <div className="container-fluid px-0">
      <header className="mb-4">
        <h1 className="h3 mb-1">Base stations e etiquetas</h1>
        <p className="text-muted mb-0">Visão operacional agrupada por `ap_code`, com controle de etiquetas, templates compatíveis e comandos pela API.</p>
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
                <div className="mb-3">
                  <label htmlFor="catalog-expected-ap-code" className="form-label">Base station esperada</label>
                  <input
                    id="catalog-expected-ap-code"
                    className="form-control"
                    value={createForm.expected_ap_code}
                    onChange={(event) => setCreateForm((current) => ({ ...current, expected_ap_code: event.target.value }))}
                    placeholder="Ex: 40:d6:3c:2d:22:07"
                  />
                  <div className="form-text">Opcional. Usado enquanto a etiqueta ainda não foi descoberta de verdade no vendor.</div>
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
              <h2 className="h5 mb-3">Descoberta por station</h2>
              <p className="text-muted mb-4">
                Busca etiquetas já visíveis no vendor/cloud, agrupa por `ap_code` e reconcilia itens pendentes cadastrados pelo sistema.
              </p>
              <button type="button" className="btn btn-outline-primary mt-auto" onClick={() => void handleImport()} disabled={importing}>
                {importing ? 'Importando...' : 'Importar etiquetas do vendor'}
              </button>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <h2 className="h5 mb-3">Resumo geral</h2>
              <div className="d-flex justify-content-between py-2 border-bottom">
                <span className="text-muted">Base stations visíveis</span>
                <strong>{totals.stations}</strong>
              </div>
              <div className="d-flex justify-content-between py-2 border-bottom">
                <span className="text-muted">Etiquetas mapeadas</span>
                <strong>{totals.tags}</strong>
              </div>
              <div className="d-flex justify-content-between py-2 border-bottom">
                <span className="text-muted">Online</span>
                <strong>{totals.online}</strong>
              </div>
              <div className="d-flex justify-content-between py-2">
                <span className="text-muted">Offline</span>
                <strong>{totals.offline}</strong>
              </div>
              <button type="button" className="btn btn-outline-secondary w-100 mt-3" onClick={() => void reloadAll()}>
                Atualizar visão operacional
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
          title="Não foi possível carregar as base stations"
          message="Verifique a conexão com o BFF e tente novamente."
          onRetry={() => void reloadAll()}
        />
      ) : loading ? (
        <LoadingState variant="skeleton" lines={10} />
      ) : stations.length === 0 ? (
        <EmptyState
          title="Nenhuma base station visível"
          description="Importe etiquetas do vendor para descobrir `ap_code` e montar a visão operacional por station."
          action={
            <button className="btn btn-outline-primary" type="button" onClick={() => void handleImport()}>
              Importar do vendor
            </button>
          }
        />
      ) : (
        <>
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body">
              <div className="d-flex flex-wrap gap-2">
                {stations.map((station) => (
                  <button
                    key={station.station_code}
                    type="button"
                    className={`btn ${activeStation?.station_code === station.station_code ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => setSelectedStationCode(station.station_code)}
                  >
                    {stationLabel(station.station_code)} ({station.total_tags})
                  </button>
                ))}
              </div>
            </div>
          </div>

          {activeStation ? (
            <>
              <div className="row g-4 mb-4">
                <div className="col-12 col-lg-4">
                  <div className="card border-0 shadow-sm h-100">
                    <div className="card-body">
                      <h2 className="h5 mb-3">Station ativa</h2>
                      <div className="fs-5 fw-semibold">{stationLabel(activeStation.station_code)}</div>
                      <p className="text-muted mb-3">
                        {activeStation.station_code === 'UNASSIGNED'
                          ? 'Etiquetas sem associação conhecida a uma base station.'
                          : 'Identificador operacional derivado do campo `ap_code` retornado pelo vendor.'}
                      </p>
                      <div className="d-flex justify-content-between py-2 border-bottom">
                        <span className="text-muted">Etiquetas</span>
                        <strong>{activeStation.total_tags}</strong>
                      </div>
                      <div className="d-flex justify-content-between py-2 border-bottom">
                        <span className="text-muted">Online</span>
                        <strong>{activeStation.online_tags}</strong>
                      </div>
                      <div className="d-flex justify-content-between py-2">
                        <span className="text-muted">Offline</span>
                        <strong>{activeStation.offline_tags}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-12 col-lg-8">
                  <div className="card border-0 shadow-sm h-100">
                    <div className="card-body">
                      <h2 className="h5 mb-3">Capacidade de operação</h2>
                      <div className="row g-3">
                        <div className="col-12 col-md-6">
                          <div className="border rounded p-3 h-100">
                            <div className="text-muted small mb-1">Produtos disponíveis</div>
                            <div className="fw-semibold">{products.length}</div>
                            <div className="small text-muted mt-2">Catálogo global usado para bind e atualização direta.</div>
                          </div>
                        </div>
                        <div className="col-12 col-md-6">
                          <div className="border rounded p-3 h-100">
                            <div className="text-muted small mb-1">Templates compatíveis</div>
                            <div className="fw-semibold">
                              {activeTags.reduce((total, tag) => total + tag.compatible_templates.length, 0)}
                            </div>
                            <div className="small text-muted mt-2">Somatório das opções compatíveis expostas nas etiquetas da station.</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card border-0 shadow-sm">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h2 className="h5 mb-0">Etiquetas da station ({activeTags.length})</h2>
                    <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => void reloadOverview()}>
                      Recarregar station
                    </button>
                  </div>

                  {activeTags.length === 0 ? (
                    <EmptyState
                      title="Nenhuma etiqueta nesta station"
                      description="A station está visível, mas ainda não há etiquetas reconciliadas nela."
                    />
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover align-middle">
                        <thead className="table-light">
                          <tr>
                            <th>Etiqueta</th>
                            <th>Registro</th>
                            <th>Status</th>
                            <th>Bateria</th>
                            <th>Produto atual</th>
                            <th>Template atual</th>
                            <th>Tipo</th>
                            <th>Última leitura</th>
                            <th>Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activeTags.map((tag) => (
                            <tr key={tag.esl_code}>
                              <td>
                                <div className="fw-semibold"><code>{tag.esl_code}</code></div>
                                <small className="text-muted">{tag.display_name ?? 'Sem nome local'}</small>
                                {tag.expected_ap_code && !tag.ap_code ? (
                                  <div className="small text-muted mt-1">Base esperada: {tag.expected_ap_code}</div>
                                ) : null}
                              </td>
                              <td>
                                <span className={`badge ${registrationBadgeClass(tag.registration_status)}`}>{registrationLabel(tag.registration_status)}</span>
                              </td>
                              <td>
                                <span className={`badge ${statusBadgeClass(tag)}`}>{tag.status}</span>
                              </td>
                              <td>{formatBattery(tag)}</td>
                              <td>
                                {tag.binding ? (
                                  <>
                                    <div className="fw-semibold">{tag.binding.product_code}</div>
                                    {productByCode.get(tag.binding.product_code) ? (
                                      <small className="text-muted">
                                        {formatCurrencyBRL(productByCode.get(tag.binding.product_code)!.price)}
                                      </small>
                                    ) : null}
                                  </>
                                ) : (
                                  <span className="text-muted">Sem vínculo</span>
                                )}
                              </td>
                              <td>{tag.binding?.template_id ?? '—'}</td>
                              <td>
                                <div>{tag.esltype_code ?? 'Tipo desconhecido'}</div>
                                <small className="text-muted">{tag.compatibility_known ? `${tag.compatible_templates.length} template(s)` : 'Compatibilidade desconhecida'}</small>
                              </td>
                              <td>{formatDateTime(tag.snapshot?.seen_at ?? tag.snapshot?.updated_at ?? tag.snapshot?.created_at)}</td>
                              <td>
                                <div className="d-flex flex-wrap gap-2">
                                  <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => openControls(tag)}>
                                    {activeTagCode === tag.esl_code ? 'Fechar controles' : 'Controlar'}
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-dark"
                                    onClick={() => void handleSearch(tag)}
                                    disabled={rowBusyCode === tag.esl_code || tag.registration_status === 'PENDING_DISCOVERY'}
                                  >
                                    Localizar
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-secondary"
                                    onClick={() => void handleRefresh(tag)}
                                    disabled={rowBusyCode === tag.esl_code || tag.registration_status === 'PENDING_DISCOVERY'}
                                  >
                                    Refresh
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={() => void handleUnbind(tag)}
                                    disabled={!tag.binding || rowBusyCode === tag.esl_code || tag.registration_status === 'PENDING_DISCOVERY'}
                                  >
                                    Desvincular
                                  </button>
                                </div>

                                {activeTagCode === tag.esl_code ? (
                                  <div className="border rounded p-3 mt-3 bg-light">
                                    {tag.registration_status === 'PENDING_DISCOVERY' ? (
                                      <div className="alert alert-warning py-2 mb-3" role="alert">
                                        Etiqueta cadastrada localmente. Aguarde descoberta real no vendor/base station para habilitar bind, LED e refresh.
                                      </div>
                                    ) : null}
                                    <div className="row g-2">
                                      <div className="col-12 col-lg-6">
                                        <label className="form-label">Produto</label>
                                        <select
                                          className="form-select"
                                          value={bindForm.product_code}
                                          onChange={(event) => {
                                            const selectedCode = event.target.value;
                                            setBindForm((current) => ({ ...current, product_code: selectedCode }));
                                            setTemplatePayloadForm(productToTemplatePayload(productByCode.get(selectedCode)));
                                          }}
                                        >
                                          <option value="">Selecione um produto</option>
                                          {products.map((product) => (
                                            <option key={product.product_code} value={product.product_code}>
                                              {product.product_code} - {product.product_name}
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                      <div className="col-12 col-lg-6">
                                        <label className="form-label">Template compatível</label>
                                        <select
                                          className="form-select"
                                          value={bindForm.template_id}
                                          onChange={(event) => setBindForm((current) => ({ ...current, template_id: event.target.value }))}
                                          disabled={tag.compatible_templates.length === 0}
                                        >
                                          <option value="">
                                            {tag.compatibility_known ? 'Sem template fixo' : 'Compatibilidade desconhecida'}
                                          </option>
                                          {tag.compatible_templates.map((template) => (
                                            <option key={template.id} value={String(template.id)}>
                                              {template.id} - {template.esltemplate_name ?? 'Sem nome'}
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                    </div>

                                    {bindForm.product_code ? (
                                      <div className="small text-muted mt-3">
                                        Produto selecionado: {productByCode.get(bindForm.product_code)?.product_name ?? bindForm.product_code}
                                      </div>
                                    ) : null}

                                    {bindForm.template_id ? (
                                      <div className="mt-3 border rounded p-3 bg-white">
                                        <div className="d-flex justify-content-between align-items-start gap-3 mb-2">
                                          <div>
                                            <div className="fw-semibold">{templateProfile.title}</div>
                                            <div className="small text-muted">
                                              {templateProfile.description}
                                            </div>
                                          </div>
                                          <span className="badge bg-light text-dark border">
                                            Template {bindForm.template_id}
                                          </span>
                                        </div>

                                        <div className="row g-2">
                                          {templateFieldDefinitions
                                            .filter((field) => templateProfile.fields.includes(field.key))
                                            .map((field) => (
                                            <div key={field.key} className="col-12 col-md-6 col-xl-4">
                                              <label className="form-label small">{templateProfile.fieldLabels?.[field.key] ?? field.label}</label>
                                              <input
                                                className="form-control form-control-sm"
                                                inputMode={field.type === 'number' ? 'decimal' : undefined}
                                                value={templatePayloadForm[field.key]}
                                                onChange={(event) =>
                                                  setTemplatePayloadForm((current) => ({
                                                    ...current,
                                                    [field.key]: event.target.value
                                                  }))
                                                }
                                                placeholder={field.placeholder}
                                              />
                                            </div>
                                          ))}
                                          {templateProfile.allowExtend ? (
                                            <div className="col-12">
                                              <label className="form-label small">Extend (JSON opcional)</label>
                                              <textarea
                                                className="form-control form-control-sm"
                                                rows={3}
                                                value={templatePayloadForm.extend}
                                                onChange={(event) =>
                                                  setTemplatePayloadForm((current) => ({
                                                    ...current,
                                                    extend: event.target.value
                                                  }))
                                                }
                                                placeholder='Ex: {"origem":"ilha","campanha":"Páscoa"}'
                                              />
                                            </div>
                                          ) : null}
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="small text-muted mt-3">
                                        Selecione um template para visualizar e preencher os campos que serão enviados na atualização direta.
                                      </div>
                                    )}

                                    <div className="d-flex flex-wrap gap-2 mt-3">
                                      <button
                                        type="button"
                                        className="btn btn-primary btn-sm"
                                        onClick={() => void handleBind(tag)}
                                        disabled={rowBusyCode === tag.esl_code || tag.registration_status === 'PENDING_DISCOVERY'}
                                      >
                                        Vincular produto
                                      </button>
                                      <button
                                        type="button"
                                        className="btn btn-outline-primary btn-sm"
                                        onClick={() => void handleDirectUpdate(tag)}
                                        disabled={rowBusyCode === tag.esl_code || tag.registration_status === 'PENDING_DISCOVERY' || !bindForm.template_id}
                                      >
                                        Aplicar template
                                      </button>
                                    </div>
                                  </div>
                                ) : null}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : null}
        </>
      )}
    </div>
  );
}

export default Etiquetas;

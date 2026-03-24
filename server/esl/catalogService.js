function buildCatalogItem(item, binding = null, snapshot = null) {
  return {
    ...item,
    binding,
    snapshot
  };
}

function normalizeStationCode(value) {
  return value && String(value).trim() ? String(value).trim() : 'UNASSIGNED';
}

function resolveRegistrationStatusForDiscovery(existingStatus) {
  return existingStatus === 'BOUND' ? 'BOUND' : 'REGISTERED';
}

function buildTagOverview(item, compatibleTemplates) {
  const snapshot = item.snapshot ?? null;
  const battery =
    snapshot?.battery_percent != null ? Number(snapshot.battery_percent) : snapshot?.esl_battery != null ? Number(snapshot.esl_battery) : null;

  return {
    esl_code: item.esl_code,
    display_name: item.display_name,
    ap_code: item.ap_code ?? item.snapshot?.ap_code ?? null,
    expected_ap_code: item.expected_ap_code ?? null,
    station_code: normalizeStationCode(item.ap_code ?? item.snapshot?.ap_code ?? item.expected_ap_code ?? null),
    esltype_code: item.esltype_code ?? item.snapshot?.esltype_code ?? null,
    status: !snapshot ? 'UNKNOWN' : snapshot.online === 1 ? 'ONLINE' : 'OFFLINE',
    battery,
    compatibility_known: Boolean(item.esltype_code ?? item.snapshot?.esltype_code),
    registration_status: item.registration_status,
    binding: item.binding,
    snapshot,
    compatible_templates: compatibleTemplates
  };
}

export class EslCatalogService {
  constructor({ eslCatalogRepo, bindingRepo, statusRepo, productRepo, templateService, statusService, bindingService, ledService }) {
    this.eslCatalogRepo = eslCatalogRepo;
    this.bindingRepo = bindingRepo;
    this.statusRepo = statusRepo;
    this.productRepo = productRepo;
    this.templateService = templateService;
    this.statusService = statusService;
    this.bindingService = bindingService;
    this.ledService = ledService;
  }

  async listCatalog() {
    // O catálogo é uma visão composta: cadastro local + vínculo + último snapshot.
    // Essa junção evita round-trips extras no frontend e concentra reconciliação aqui.
    const [items, bindings, snapshots] = await Promise.all([
      this.eslCatalogRepo.listCatalogItems(),
      this.bindingRepo.listBindings(),
      this.statusRepo.listStatusSnapshots()
    ]);

    const bindingByEsl = new Map(bindings.map((item) => [item.esl_code, item]));
    const snapshotByEsl = new Map(snapshots.map((item) => [item.esl_code, item]));

    return items.map((item) => buildCatalogItem(item, bindingByEsl.get(item.esl_code) ?? null, snapshotByEsl.get(item.esl_code) ?? null));
  }

  async buildStationOverview() {
    const [catalogItems, templateResult] = await Promise.all([
      this.listCatalog(),
      this.templateService.queryTemplates({ page: 1, size: 200, forceRefresh: false })
    ]);

    const templates = Array.isArray(templateResult?.data) ? templateResult.data : [];
    const grouped = new Map();

    for (const item of catalogItems) {
      const eslTypeCode = item.esltype_code ?? item.snapshot?.esltype_code ?? null;
      const compatibleTemplates = eslTypeCode ? templates.filter((template) => template.esltype_code === eslTypeCode) : [];
      const tag = buildTagOverview(item, compatibleTemplates);
      const stationCode = tag.station_code;

      if (!grouped.has(stationCode)) {
        grouped.set(stationCode, {
          station_code: stationCode,
          ap_code: stationCode === 'UNASSIGNED' ? null : stationCode,
          total_tags: 0,
          online_tags: 0,
          offline_tags: 0,
          tags: []
        });
      }

      const station = grouped.get(stationCode);
      station.tags.push(tag);
      station.total_tags += 1;

      if (tag.status === 'ONLINE') {
        station.online_tags += 1;
      } else if (tag.status === 'OFFLINE') {
        station.offline_tags += 1;
      }
    }

    const stations = Array.from(grouped.values())
      .map((station) => ({
        ...station,
        tags: station.tags.sort((a, b) => a.esl_code.localeCompare(b.esl_code))
      }))
      .sort((a, b) => {
        if (a.station_code === 'UNASSIGNED') return 1;
        if (b.station_code === 'UNASSIGNED') return -1;
        return a.station_code.localeCompare(b.station_code);
      });

    return {
      stations,
      totals: {
        stations: stations.length,
        tags: stations.reduce((acc, station) => acc + station.total_tags, 0),
        online: stations.reduce((acc, station) => acc + station.online_tags, 0),
        offline: stations.reduce((acc, station) => acc + station.offline_tags, 0)
      }
    };
  }

  async createCatalogItem(input) {
    return this.eslCatalogRepo.createCatalogItem({
      esl_code: input.esl_code,
      display_name: input.display_name ?? null,
      expected_ap_code: input.expected_ap_code ?? null,
      source: 'MANUAL',
      registration_status: 'PENDING_DISCOVERY'
    });
  }

  async updateCatalogItem(eslCode, updates) {
    return this.eslCatalogRepo.updateCatalogItem(eslCode, {
      display_name: updates.display_name,
      esltype_code: updates.esltype_code,
      ap_code: updates.ap_code,
      expected_ap_code: updates.expected_ap_code
    });
  }

  async registerDiscoveredEsl(snapshot) {
    if (!snapshot?.esl_code) {
      return null;
    }

    const existing = await this.eslCatalogRepo.getCatalogItem(snapshot.esl_code);

    return this.eslCatalogRepo.upsertCatalogItem({
      esl_code: snapshot.esl_code,
      display_name: existing?.display_name ?? null,
      esltype_code: snapshot.esltype_code ?? existing?.esltype_code ?? null,
      ap_code: snapshot.ap_code ?? existing?.ap_code ?? null,
      expected_ap_code: existing?.expected_ap_code ?? snapshot.ap_code ?? null,
      source: existing?.source ?? 'VENDOR_DISCOVERY',
      registration_status: resolveRegistrationStatusForDiscovery(existing?.registration_status),
      last_seen_at: snapshot.updated_at ?? snapshot.created_at ?? new Date().toISOString()
    });
  }

  async importFromVendor({ pageSize = 100 } = {}) {
    // Importação faz reconciliação pull-based a partir do vendor/cloud.
    // Não configura base station; apenas reflete o que já foi descoberto por ela.
    const countResult = await this.statusService.queryCount();
    if (!countResult.success) {
      return countResult;
    }

    const totalCount = Math.max(0, Number(countResult.data?.total_count ?? 0));
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    let imported = 0;

    for (let page = 1; page <= totalPages; page += 1) {
      const pageResult = await this.statusService.queryEslStatus({ page, size: pageSize });
      if (!pageResult.success) {
        return pageResult;
      }

      imported += Array.isArray(pageResult.data) ? pageResult.data.length : 0;
    }

    return {
      success: true,
      error_code: 0,
      error_msg: '',
      request_id: countResult.request_id,
      received_at: new Date().toISOString(),
      data: {
        imported_count: imported,
        total_count: totalCount
      }
    };
  }

  async bindCatalogItem(eslCode, input) {
    // Antes do bind remoto validamos a consistência local para retornar erro claro
    // ao operador quando a ESL ou o produto ainda não existem no catálogo.
    const [catalogItem, product] = await Promise.all([
      this.eslCatalogRepo.getCatalogItem(eslCode),
      this.productRepo.getProduct(input.product_code)
    ]);

    if (!catalogItem) {
      const error = new Error('Etiqueta não cadastrada.');
      error.statusCode = 404;
      error.code = 'ESL_CATALOG_NOT_FOUND';
      throw error;
    }

    if (catalogItem.registration_status === 'PENDING_DISCOVERY') {
      const error = new Error('Etiqueta ainda não foi descoberta no vendor/base station. Sincronize a descoberta antes de vincular.');
      error.statusCode = 409;
      error.code = 'ESL_PENDING_DISCOVERY';
      throw error;
    }

    if (!product) {
      const error = new Error('Produto não encontrado.');
      error.statusCode = 404;
      error.code = 'PRODUCT_NOT_FOUND';
      throw error;
    }

    const result = await this.bindingService.bind({
      esl_code: eslCode,
      product_code: input.product_code,
      template_id: input.template_id ?? null
    });

    return result;
  }

  async unbindCatalogItem(eslCode) {
    const catalogItem = await this.eslCatalogRepo.getCatalogItem(eslCode);
    if (!catalogItem) {
      const error = new Error('Etiqueta não cadastrada.');
      error.statusCode = 404;
      error.code = 'ESL_CATALOG_NOT_FOUND';
      throw error;
    }

    if (catalogItem.registration_status === 'PENDING_DISCOVERY') {
      const error = new Error('Etiqueta ainda não foi descoberta no vendor/base station. Não é possível desvincular antes do registro real.');
      error.statusCode = 409;
      error.code = 'ESL_PENDING_DISCOVERY';
      throw error;
    }

    return this.bindingService.unbind(eslCode);
  }

  async searchCatalogItem(eslCode) {
    const catalogItem = await this.eslCatalogRepo.getCatalogItem(eslCode);
    if (!catalogItem) {
      const error = new Error('Etiqueta não cadastrada.');
      error.statusCode = 404;
      error.code = 'ESL_CATALOG_NOT_FOUND';
      throw error;
    }

    if (catalogItem.registration_status === 'PENDING_DISCOVERY') {
      const error = new Error('Etiqueta ainda não foi descoberta no vendor/base station. Não é possível localizar antes do registro real.');
      error.statusCode = 409;
      error.code = 'ESL_PENDING_DISCOVERY';
      throw error;
    }

    return this.ledService.search([eslCode]);
  }
}

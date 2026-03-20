function buildCatalogItem(item, binding = null, snapshot = null) {
  return {
    ...item,
    binding,
    snapshot
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
    const [items, bindings, snapshots] = await Promise.all([
      this.eslCatalogRepo.listCatalogItems(),
      this.bindingRepo.listBindings(),
      this.statusRepo.listStatusSnapshots()
    ]);

    const bindingByEsl = new Map(bindings.map((item) => [item.esl_code, item]));
    const snapshotByEsl = new Map(snapshots.map((item) => [item.esl_code, item]));

    return items.map((item) => buildCatalogItem(item, bindingByEsl.get(item.esl_code) ?? null, snapshotByEsl.get(item.esl_code) ?? null));
  }

  async createCatalogItem(input) {
    return this.eslCatalogRepo.createCatalogItem({
      esl_code: input.esl_code,
      display_name: input.display_name ?? null,
      source: 'MANUAL',
      registration_status: 'REGISTERED'
    });
  }

  async updateCatalogItem(eslCode, updates) {
    return this.eslCatalogRepo.updateCatalogItem(eslCode, {
      display_name: updates.display_name,
      esltype_code: updates.esltype_code,
      ap_code: updates.ap_code
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
      source: existing?.source ?? 'VENDOR_DISCOVERY',
      registration_status: existing?.registration_status ?? 'REGISTERED',
      last_seen_at: snapshot.updated_at ?? snapshot.created_at ?? new Date().toISOString()
    });
  }

  async importFromVendor({ pageSize = 100 } = {}) {
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

    return this.bindingService.unbind(eslCode);
  }

  async searchCatalogItem(eslCode) {
    return this.ledService.search([eslCode]);
  }
}

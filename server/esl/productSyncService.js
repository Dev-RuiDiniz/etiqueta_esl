import { recordLogicalVendorFailure, runWithRetry } from './eslRetryPolicy.js';
import { toVendorProduct, toVendorProductsArray } from './eslMapper.js';

function chunkArray(input, size) {
  const result = [];

  for (let index = 0; index < input.length; index += size) {
    result.push(input.slice(index, index + size));
  }

  return result;
}

export class EslProductSyncService {
  constructor({ config, apiClient, refreshService, auditLogService, bindingRepo, deadLetterRepo }) {
    this.config = config;
    this.apiClient = apiClient;
    this.refreshService = refreshService;
    this.auditLogService = auditLogService;
    this.bindingRepo = bindingRepo;
    this.deadLetterRepo = deadLetterRepo;
    // Base interna em memória (v1): simula source of truth + fila de saída.
    this.productsByCode = new Map();
    this.outbox = [];
  }

  enqueueProductUpsert(product) {
    this.outbox.push(product);

    return {
      accepted: true,
      queued_count: this.outbox.length
    };
  }

  enqueueProductUpserts(products) {
    for (const product of products) {
      this.outbox.push(product);
    }

    return {
      accepted: true,
      queued_count: this.outbox.length
    };
  }

  async flushPendingUpserts(batchSize = 50) {
    if (this.outbox.length === 0) {
      return {
        success: true,
        flushed_count: 0,
        queued_count: 0
      };
    }

    // Esvazia a fila local e envia em lotes para reduzir overhead no fornecedor.
    const pending = this.outbox.splice(0, this.outbox.length);
    const chunks = chunkArray(pending, Math.max(1, batchSize));
    let flushedCount = 0;

    for (const items of chunks) {
      const result = await this.upsertProducts(items);
      if (!result.success) {
        for (const item of items) {
          this.outbox.push(item);
        }

        return {
          success: false,
          flushed_count: flushedCount,
          queued_count: this.outbox.length,
          error_code: result.error_code,
          error_msg: result.error_msg
        };
      }

      flushedCount += items.length;
    }

    return {
      success: true,
      flushed_count: flushedCount,
      queued_count: this.outbox.length
    };
  }

  async upsertProduct(product) {
    const vendorProduct = toVendorProduct(product);

    const result = await runWithRetry(
      () => this.apiClient.post('/product/create', vendorProduct),
      {
        operation: 'product.create',
        payload: vendorProduct,
        meta: { product_code: vendorProduct.pc }
      },
      this.config,
      { deadLetterRepo: this.deadLetterRepo }
    );

    await this.auditLogService.record({
      operation: 'product.create',
      payload: vendorProduct,
      request_id: result.request_id,
      success: result.success,
      error_code: result.error_code,
      error_msg: result.error_msg,
      response: result.data
    });

    if (!result.success) {
      await recordLogicalVendorFailure(
        result,
        {
          operation: 'product.create',
          payload: vendorProduct,
          meta: { product_code: vendorProduct.pc }
        },
        this.deadLetterRepo
      );
    }

    if (result.success && vendorProduct.pc) {
      // Em sucesso, atualiza cache de produtos e agenda refresh das etiquetas vinculadas.
      this.productsByCode.set(vendorProduct.pc, {
        ...product,
        product_code: vendorProduct.pc,
        last_synced_at: new Date().toISOString(),
        sync_status: 'SYNCED',
        sync_error: null
      });

      const bindings = await this.bindingRepo.listBindingsByProductCode(vendorProduct.pc);
      this.refreshService.enqueueRefresh(bindings.map((item) => item.esl_code));
    }

    return result;
  }

  async upsertProducts(products) {
    const vendorProducts = toVendorProductsArray(products);

    const result = await runWithRetry(
      () => this.apiClient.post('/product/create_multiple', { f1: JSON.stringify(vendorProducts) }),
      {
        operation: 'product.create_multiple',
        payload: vendorProducts,
        meta: { count: vendorProducts.length }
      },
      this.config,
      { deadLetterRepo: this.deadLetterRepo }
    );

    await this.auditLogService.record({
      operation: 'product.create_multiple',
      payload: vendorProducts,
      request_id: result.request_id,
      success: result.success,
      error_code: result.error_code,
      error_msg: result.error_msg,
      response: result.data
    });

    if (!result.success) {
      await recordLogicalVendorFailure(
        result,
        {
          operation: 'product.create_multiple',
          payload: vendorProducts,
          meta: { count: vendorProducts.length }
        },
        this.deadLetterRepo
      );
    }

    if (result.success) {
      // Atualiza todos os produtos do lote e agenda refresh por produto impactado.
      for (const item of vendorProducts) {
        if (!item.pc) {
          continue;
        }

        this.productsByCode.set(item.pc, {
          product_code: item.pc,
          product_name: item.pn,
          price: item.pp,
          quantity: item.qty,
          last_synced_at: new Date().toISOString(),
          sync_status: 'SYNCED',
          sync_error: null
        });

        const bindings = await this.bindingRepo.listBindingsByProductCode(item.pc);
        this.refreshService.enqueueRefresh(bindings.map((binding) => binding.esl_code));
      }
    }

    return result;
  }

  listProducts() {
    return Array.from(this.productsByCode.values());
  }
}

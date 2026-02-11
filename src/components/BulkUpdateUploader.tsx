import { useMemo, useState } from 'react';
import { simulateBulkItemAck, simulateBulkItemSend } from '../services/updatesService';
import type { PriceUpdateItem } from '../types/updates';
import { formatCurrencyBRL } from '../utils/format';
import BulkUpdateTable from './BulkUpdateTable';

type ParsedCsvRow = {
  id: string;
  sku?: string;
  tagId?: string;
  newPrice: number;
};

function parseCsvRows(content: string): ParsedCsvRow[] {
  const parsedRows: ParsedCsvRow[] = [];
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  lines.forEach((line, index) => {
    const delimiter = line.includes(';') ? ';' : ',';
    const parts = line.split(delimiter).map((part) => part.trim());

    if (parts.length < 2) {
      return;
    }

    if (parts.length >= 3) {
      const [sku, price, tagId] = parts;
      const parsedPrice = Number(price.replace(',', '.'));

      if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
        return;
      }

      parsedRows.push({
        id: `csv-${index}-${tagId || sku}`,
        sku,
        tagId: tagId || undefined,
        newPrice: parsedPrice
      });
      return;
    }

    const [tagId, price] = parts;
    const parsedPrice = Number(price.replace(',', '.'));

    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      return;
    }

    parsedRows.push({
      id: `csv-${index}-${tagId}`,
      tagId,
      newPrice: parsedPrice
    });
  });

  return parsedRows;
}


function BulkUpdateUploader() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [csvRows, setCsvRows] = useState<ParsedCsvRow[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  const [processedItems, setProcessedItems] = useState<PriceUpdateItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const previewRows = useMemo(() => csvRows.slice(0, 10), [csvRows]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    setCsvRows([]);
    setProcessedItems([]);
    setParseError(null);
  };

  const handleProcessFile = async () => {
    if (!selectedFile) {
      setParseError('Selecione um arquivo CSV antes de processar.');
      return;
    }

    setIsParsing(true);
    setParseError(null);

    try {
      const content = await selectedFile.text();
      const parsedRows = parseCsvRows(content);

      if (parsedRows.length === 0) {
        setParseError('Não foi possível identificar linhas válidas no CSV.');
      }

      setCsvRows(parsedRows);
    } catch {
      setParseError('Erro ao ler arquivo CSV.');
    } finally {
      setIsParsing(false);
    }
  };

  const updateItem = (itemId: string, updater: (item: PriceUpdateItem) => PriceUpdateItem) => {
    setProcessedItems((currentItems) => currentItems.map((item) => (item.id === itemId ? updater(item) : item)));
  };

  const runItemFlow = async (item: PriceUpdateItem) => {
    const sentItem = await simulateBulkItemSend(item);
    updateItem(item.id, () => sentItem);

    const ackItem = await simulateBulkItemAck(sentItem);
    updateItem(item.id, () => ackItem);
  };

  const handleSendUpdates = async () => {
    if (csvRows.length === 0) {
      return;
    }

    const initialItems: PriceUpdateItem[] = csvRows.map((row) => ({
      id: row.id,
      sku: row.sku,
      tagId: row.tagId,
      newPrice: row.newPrice,
      status: 'SENT'
    }));

    setProcessedItems(initialItems);
    setIsProcessing(true);

    try {
      await Promise.all(initialItems.map((item) => runItemFlow(item)));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetryItem = async (itemId: string) => {
    const failedItem = processedItems.find((item) => item.id === itemId);
    if (!failedItem) {
      return;
    }

    setIsProcessing(true);
    updateItem(itemId, (item) => ({ ...item, status: 'SENT', errorMessage: undefined }));

    try {
      await runItemFlow({ ...failedItem, status: 'SENT', errorMessage: undefined });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-body">
        <h2 className="h5 mb-3">Atualização em lote</h2>

        <div className="row g-3 align-items-end">
          <div className="col-12 col-lg-8">
            <label htmlFor="bulk-csv" className="form-label">
              Arquivo CSV
            </label>
            <input id="bulk-csv" className="form-control" type="file" accept=".csv,text/csv" onChange={handleFileChange} />
          </div>
          <div className="col-12 col-lg-4 d-grid">
            <button type="button" className="btn btn-outline-primary" disabled={!selectedFile || isParsing} onClick={() => void handleProcessFile()}>
              {isParsing ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                  Processando...
                </>
              ) : (
                'Processar arquivo'
              )}
            </button>
          </div>
        </div>

        {selectedFile ? (
          <div className="alert alert-light border mt-3" role="status">
            Arquivo selecionado: <strong>{selectedFile.name}</strong> ({(selectedFile.size / 1024).toFixed(1)} KB)
          </div>
        ) : null}

        {parseError ? (
          <div className="alert alert-danger" role="alert">
            {parseError}
          </div>
        ) : null}

        {csvRows.length > 0 ? (
          <>
            <div className="table-responsive mt-3">
              <table className="table table-sm table-striped align-middle">
                <thead>
                  <tr>
                    <th scope="col">SKU</th>
                    <th scope="col">Tag ID</th>
                    <th scope="col">Novo preço</th>
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row) => (
                    <tr key={row.id}>
                      <td>{row.sku ?? '—'}</td>
                      <td>{row.tagId ?? '—'}</td>
                      <td>{formatCurrencyBRL(row.newPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="d-flex justify-content-between align-items-center mt-3">
              <small className="text-muted">
                Prévia exibindo {previewRows.length} de {csvRows.length} linha(s).
              </small>
              <button type="button" className="btn btn-primary" disabled={isProcessing} onClick={() => void handleSendUpdates()}>
                Enviar atualizações
              </button>
            </div>
          </>
        ) : (
          <div className="alert alert-secondary mt-3 mb-0">Nenhum item carregado para atualização em lote.</div>
        )}

        <BulkUpdateTable items={processedItems} isProcessing={isProcessing} onRetryItem={(itemId) => void handleRetryItem(itemId)} />
      </div>
    </div>
  );
}

export default BulkUpdateUploader;

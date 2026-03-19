// Utilitário de parse de CSV para uploads de atualização em lote.
// Suporta delimitadores ',' e ';', detecta BOM UTF-8 e valida limites.

export type ParsedCsvRow = {
  id: string;
  sku?: string;
  tagId?: string;
  newPrice: number;
};

export class CsvParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CsvParseError';
  }
}

const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB
const MAX_ROWS = 5000;

export function parseCsvContent(content: string): ParsedCsvRow[] {
  // Remove BOM UTF-8 se presente (arquivos exportados do Excel Windows)
  const cleaned = content.startsWith('\uFEFF') ? content.slice(1) : content;

  const parsedRows: ParsedCsvRow[] = [];
  const lines = cleaned
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length > MAX_ROWS) {
    throw new CsvParseError(`O arquivo excede o limite de ${MAX_ROWS} linhas.`);
  }

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

export async function parseCsvFile(file: File): Promise<ParsedCsvRow[]> {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new CsvParseError(
      `O arquivo excede o limite de ${Math.round(MAX_FILE_SIZE_BYTES / 1024 / 1024)} MB.`
    );
  }

  const content = await file.text();
  return parseCsvContent(content);
}

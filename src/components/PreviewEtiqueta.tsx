import { formatCurrencyBRL } from '../utils/format';
import '../styles/previewEtiqueta.css';

type PreviewEtiquetaProps = {
  productName: string;
  price: number;
  unitLabel: string;
  sku: string;
  promotion?: {
    enabled: boolean;
    fromPrice?: number;
    label?: string;
  };
  additionalInfo?: {
    corridor?: string;
    sector?: string;
  };
};

function PreviewEtiqueta({ productName, price, unitLabel, sku, promotion, additionalInfo }: PreviewEtiquetaProps) {
  const hasPromotion = Boolean(promotion?.enabled);
  const promotionLabel = promotion?.label?.trim() || 'OFERTA';

  return (
    <article className="preview-etiqueta" aria-label="Preview da etiqueta eletrônica">
      <header className="preview-etiqueta__header">
        <h4 className="preview-etiqueta__product" title={productName}>
          {productName}
        </h4>
        {hasPromotion ? <span className="preview-etiqueta__offer-badge">{promotionLabel}</span> : null}
      </header>

      {hasPromotion && promotion?.fromPrice ? (
        <p className="preview-etiqueta__offer-text">De {formatCurrencyBRL(promotion.fromPrice)} por</p>
      ) : (
        <p className="preview-etiqueta__offer-text preview-etiqueta__offer-text--empty" aria-hidden="true">
          .
        </p>
      )}

      <div className="preview-etiqueta__price-row">
        <p className="preview-etiqueta__price">{formatCurrencyBRL(price)}</p>
        <p className="preview-etiqueta__unit">{unitLabel}</p>
      </div>

      <footer className="preview-etiqueta__footer">
        <p className="preview-etiqueta__meta">SKU: {sku}</p>
        {additionalInfo?.corridor || additionalInfo?.sector ? (
          <p className="preview-etiqueta__meta">
            {[additionalInfo?.sector, additionalInfo?.corridor].filter(Boolean).join(' · ')}
          </p>
        ) : null}
      </footer>
    </article>
  );
}

export type { PreviewEtiquetaProps };
export default PreviewEtiqueta;

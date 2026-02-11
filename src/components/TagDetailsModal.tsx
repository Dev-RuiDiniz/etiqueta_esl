import { useEffect } from 'react';
import type { Tag } from '../types/tags';
import { useNavigate } from '../lib/router';
import { formatCurrencyBRL, formatDateTimeBR } from '../utils/format';
import BadgeStatus from './BadgeStatus';
import BatteryBadge from './BatteryBadge';
import PreviewEtiqueta from './PreviewEtiqueta';

type TagDetailsModalProps = {
  isOpen: boolean;
  tag: Tag | null;
  onClose: () => void;
};

function TagDetailsModal({ isOpen, tag, onClose }: TagDetailsModalProps) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !tag) {
    return null;
  }

  return (
    <div className="tag-modal-backdrop" role="presentation" onClick={onClose}>
      <section
        className="tag-modal card border-0"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tag-details-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="card-header bg-white d-flex justify-content-between align-items-start">
          <div>
            <h2 id="tag-details-title" className="h5 mb-1">
              Detalhes da etiqueta
            </h2>
            <p className="text-muted mb-0 small">{tag.tagId}</p>
          </div>
          <button type="button" className="btn-close" aria-label="Fechar detalhes" onClick={onClose}></button>
        </div>

        <div className="card-body">
          <div className="row g-4">
            <div className="col-12 col-lg-6">
              <dl className="row mb-0">
                <dt className="col-sm-4">EtiquetaID</dt>
                <dd className="col-sm-8">{tag.tagId}</dd>

                <dt className="col-sm-4">SKU</dt>
                <dd className="col-sm-8">{tag.sku}</dd>

                <dt className="col-sm-4">Produto</dt>
                <dd className="col-sm-8">{tag.productName}</dd>

                <dt className="col-sm-4">Preço</dt>
                <dd className="col-sm-8">{formatCurrencyBRL(tag.price)}</dd>

                <dt className="col-sm-4">Status</dt>
                <dd className="col-sm-8">
                  <BadgeStatus status={tag.status} />
                </dd>

                <dt className="col-sm-4">Bateria</dt>
                <dd className="col-sm-8">
                  <BatteryBadge battery={tag.battery} />
                </dd>

                <dt className="col-sm-4">Localização</dt>
                <dd className="col-sm-8">{tag.location}</dd>

                <dt className="col-sm-4">Última atualização</dt>
                <dd className="col-sm-8">{formatDateTimeBR(tag.lastUpdate)}</dd>
              </dl>
            </div>

            <div className="col-12 col-lg-6">
              <div className="card bg-light-subtle border h-100">
                <div className="card-body d-flex flex-column">
                  <h3 className="h6">Preview da etiqueta</h3>
                  <div className="mt-2 d-flex justify-content-center justify-content-lg-start">
                    <PreviewEtiqueta
                      productName={tag.productName}
                      price={tag.price}
                      sku={tag.sku}
                      unitLabel={tag.unitLabel}
                      promotion={tag.promotion}
                      additionalInfo={{ corridor: tag.corridor, sector: tag.category }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card-footer bg-white d-flex justify-content-end gap-2">
          <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
            Fechar
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              onClose();
              navigate(`/atualizacoes/individual?tagId=${encodeURIComponent(tag.tagId)}`);
            }}
          >
            Atualizar preço
          </button>
        </div>
      </section>
    </div>
  );
}

export default TagDetailsModal;

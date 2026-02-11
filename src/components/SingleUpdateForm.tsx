import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Tag } from '../types/tags';
import { getTags } from '../services/tagsService';
import { pollUpdateStatus, sendSinglePriceUpdate } from '../services/updatesService';
import type { SingleUpdatePayload, UpdateStatus } from '../types/updates';
import { formatCurrencyBRL, formatShortCode } from '../utils/format';
import UpdateStatusBadge from './UpdateStatusBadge';

type SingleUpdateFormProps = {
  preselectedTagId?: string | null;
};

type SubmissionState = {
  requestId: string;
  status: UpdateStatus;
  message?: string;
};

function SingleUpdateForm({ preselectedTagId }: SingleUpdateFormProps) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoadingTags, setIsLoadingTags] = useState(true);
  const [hasTagError, setHasTagError] = useState(false);

  const [selectedTagId, setSelectedTagId] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [isPromotion, setIsPromotion] = useState(false);
  const [previousPrice, setPreviousPrice] = useState('');
  const [promotionLabel, setPromotionLabel] = useState('');
  const [wasValidated, setWasValidated] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [submissionState, setSubmissionState] = useState<SubmissionState | null>(null);
  const [lastPayload, setLastPayload] = useState<SingleUpdatePayload | null>(null);

  const loadTags = useCallback(async () => {
    setIsLoadingTags(true);
    setHasTagError(false);

    try {
      const response = await getTags();
      setTags(response);
    } catch {
      setHasTagError(true);
    } finally {
      setIsLoadingTags(false);
    }
  }, []);

  useEffect(() => {
    void loadTags();
  }, [loadTags]);

  useEffect(() => {
    if (!preselectedTagId || tags.length === 0) {
      return;
    }

    const tagExists = tags.some((tag) => tag.tagId === preselectedTagId);
    if (tagExists) {
      setSelectedTagId(preselectedTagId);
    }
  }, [preselectedTagId, tags]);

  const selectedTag = useMemo(() => {
    return tags.find((tag) => tag.tagId === selectedTagId) ?? null;
  }, [selectedTagId, tags]);

  const isPreviousPriceInvalid = isPromotion && previousPrice.trim().length > 0 && Number(previousPrice) <= Number(newPrice);

  const buildPayload = useCallback((): SingleUpdatePayload | null => {
    if (!selectedTag) {
      return null;
    }

    return {
      tagId: selectedTag.tagId,
      sku: selectedTag.sku,
      productName: selectedTag.productName,
      newPrice: Number(newPrice),
      isPromotion,
      previousPrice: previousPrice.trim().length === 0 ? undefined : Number(previousPrice),
      promotionLabel: promotionLabel.trim().length === 0 ? undefined : promotionLabel.trim()
    };
  }, [isPromotion, newPrice, previousPrice, promotionLabel, selectedTag]);

  const executeUpdateFlow = useCallback(async (payload: SingleUpdatePayload) => {
    setIsSubmitting(true);
    setIsPolling(false);

    try {
      const sendResponse = await sendSinglePriceUpdate(payload);
      setSubmissionState({ requestId: sendResponse.requestId, status: 'SENT', message: 'Atualização enviada com sucesso.' });
      setIsPolling(true);

      const pollResponse = await pollUpdateStatus(sendResponse.requestId);
      setSubmissionState({
        requestId: sendResponse.requestId,
        status: pollResponse.status,
        message:
          pollResponse.status === 'CONFIRMED'
            ? 'Atualização confirmada pela etiqueta.'
            : pollResponse.errorMessage ?? 'Falha ao confirmar atualização.'
      });
    } finally {
      setIsSubmitting(false);
      setIsPolling(false);
    }
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setWasValidated(true);

    const payload = buildPayload();
    const formIsValid = payload !== null && payload.newPrice > 0 && !isPreviousPriceInvalid;

    if (!formIsValid) {
      return;
    }

    setLastPayload(payload);
    await executeUpdateFlow(payload);
  };

  const handleRetry = async () => {
    if (!lastPayload) {
      return;
    }

    await executeUpdateFlow(lastPayload);
  };

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-body">
        <h2 className="h5 mb-3">Atualização individual</h2>

        {isLoadingTags ? (
          <div className="d-flex align-items-center gap-2 text-muted">
            <div className="spinner-border spinner-border-sm" role="status" />
            <span>Carregando etiquetas...</span>
          </div>
        ) : hasTagError ? (
          <div className="alert alert-danger d-flex justify-content-between align-items-center" role="alert">
            <span>Erro ao carregar etiquetas.</span>
            <button className="btn btn-sm btn-outline-danger" type="button" onClick={() => void loadTags()}>
              Tentar novamente
            </button>
          </div>
        ) : (
          <form noValidate className={wasValidated ? 'was-validated' : ''} onSubmit={(event) => void handleSubmit(event)}>
            <div className="row g-3">
              <div className="col-12">
                <label htmlFor="tag-select" className="form-label">
                  Etiqueta
                </label>
                <select
                  id="tag-select"
                  className="form-select"
                  required
                  value={selectedTagId}
                  onChange={(event) => setSelectedTagId(event.target.value)}
                >
                  <option value="">Selecione a etiqueta</option>
                  {tags.map((tag) => (
                    <option key={tag.tagId} value={tag.tagId}>
                      {tag.tagId} · {tag.productName} ({tag.sku})
                    </option>
                  ))}
                </select>
                <div className="invalid-feedback">Selecione uma etiqueta para continuar.</div>
              </div>

              <div className="col-12 col-md-6">
                <label htmlFor="new-price" className="form-label">
                  Novo preço
                </label>
                <div className="input-group has-validation">
                  <span className="input-group-text">R$</span>
                  <input
                    id="new-price"
                    className="form-control"
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    value={newPrice}
                    onChange={(event) => setNewPrice(event.target.value)}
                  />
                  <div className="invalid-feedback">Informe um valor maior que zero.</div>
                </div>
              </div>

              <div className="col-12 col-md-6 d-flex align-items-end">
                <div className="form-check form-switch">
                  <input
                    id="promotion-toggle"
                    className="form-check-input"
                    type="checkbox"
                    checked={isPromotion}
                    onChange={(event) => setIsPromotion(event.target.checked)}
                  />
                  <label htmlFor="promotion-toggle" className="form-check-label">
                    Promoção
                  </label>
                </div>
              </div>

              {isPromotion ? (
                <>
                  <div className="col-12 col-md-6">
                    <label htmlFor="previous-price" className="form-label">
                      Preço anterior (De)
                    </label>
                    <div className="input-group">
                      <span className="input-group-text">R$</span>
                      <input
                        id="previous-price"
                        className={`form-control ${isPreviousPriceInvalid ? 'is-invalid' : ''}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={previousPrice}
                        onChange={(event) => setPreviousPrice(event.target.value)}
                      />
                      <div className="invalid-feedback">O preço "De" deve ser maior que o novo preço.</div>
                    </div>
                  </div>

                  <div className="col-12 col-md-6">
                    <label htmlFor="promotion-label" className="form-label">
                      Label promocional
                    </label>
                    <input
                      id="promotion-label"
                      className="form-control"
                      type="text"
                      maxLength={16}
                      placeholder="OFERTA"
                      value={promotionLabel}
                      onChange={(event) => setPromotionLabel(event.target.value)}
                    />
                  </div>
                </>
              ) : null}
            </div>

            {selectedTag ? (
              <div className="alert alert-light border mt-3 mb-0" role="status">
                Selecionado: <strong>{selectedTag.productName}</strong> ({selectedTag.tagId}) · preço atual{' '}
                <strong>{formatCurrencyBRL(selectedTag.price)}</strong>
              </div>
            ) : null}

            <div className="d-flex justify-content-end mt-3">
              <button type="submit" className="btn btn-primary" disabled={isSubmitting || isPolling}>
                {isSubmitting || isPolling ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                    Enviando...
                  </>
                ) : (
                  'Enviar atualização'
                )}
              </button>
            </div>
          </form>
        )}

        {submissionState ? (
          <div className={`alert mt-4 mb-0 ${submissionState.status === 'FAILED' ? 'alert-danger' : 'alert-success'}`} role="alert">
            <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2">
              <div className="d-flex align-items-center gap-2">
                <UpdateStatusBadge status={submissionState.status} />
                {isPolling ? <span className="spinner-border spinner-border-sm" role="status" aria-label="Aguardando confirmação" /> : null}
                <span className="small text-muted">Código do envio: {formatShortCode(submissionState.requestId)}</span>
              </div>
              {submissionState.status === 'FAILED' ? (
                <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => void handleRetry()}>
                  Tentar novamente
                </button>
              ) : null}
            </div>
            <p className="mb-0 mt-2">{submissionState.message}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default SingleUpdateForm;

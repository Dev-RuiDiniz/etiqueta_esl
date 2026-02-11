import { ChangeEvent } from 'react';
import { syncStatus, type Store } from '../mocks';

type TopbarProps = {
  stores: Store[];
  selectedStoreId: string;
  onStoreChange: (storeId: string) => void;
  onOpenMenu: () => void;
};

function Topbar({ stores, selectedStoreId, onStoreChange, onOpenMenu }: TopbarProps) {
  const currentStore = stores.find((store) => store.id === selectedStoreId);

  const handleStoreChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onStoreChange(event.target.value);
  };

  return (
    <header className="topbar bg-white border-bottom px-3 px-lg-4 py-3 d-flex align-items-center justify-content-between gap-3">
      <div className="d-flex align-items-center gap-3">
        <button className="btn btn-outline-secondary d-lg-none" onClick={onOpenMenu} type="button">
          ☰ <span className="ms-1">Menu</span>
        </button>

        <div>
          <p className="text-muted small mb-1">Operação</p>
          <h1 className="h5 mb-0">{currentStore?.name ?? 'Painel de Etiquetas'}</h1>
        </div>
      </div>

      <div className="d-flex flex-column flex-sm-row align-items-sm-center gap-3 ms-auto">
        <label className="d-flex align-items-center gap-2 small text-muted">
          Loja
          <select className="form-select form-select-sm" value={selectedStoreId} onChange={handleStoreChange}>
            {stores.map((store) => (
              <option key={store.id} value={store.id}>
                {store.name}
              </option>
            ))}
          </select>
        </label>

        <div className="text-end">
          <span className={`badge ${syncStatus.online ? 'text-bg-success' : 'text-bg-secondary'}`}>
            {syncStatus.online ? 'Online' : 'Offline'}
          </span>
          <p className="small text-muted mb-0 mt-1">{syncStatus.lastSyncText}</p>
        </div>
      </div>
    </header>
  );
}

export default Topbar;

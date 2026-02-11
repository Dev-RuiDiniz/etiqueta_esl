export type SyncStatus = {
  online: boolean;
  lastSyncText: string;
};

export const syncStatus: SyncStatus = {
  online: true,
  lastSyncText: 'Última sync: agora'
};

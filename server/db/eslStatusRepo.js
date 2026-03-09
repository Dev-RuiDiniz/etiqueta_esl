// Snapshot em memória do estado das etiquetas para consumo rápido no dashboard.
const snapshotsByEslCode = new Map();

export function upsertStatusSnapshots(snapshots) {
  const now = new Date().toISOString();

  for (const item of snapshots) {
    if (!item.esl_code) {
      continue;
    }

    snapshotsByEslCode.set(item.esl_code, {
      ...item,
      updated_at: item.updated_at ?? now,
      seen_at: now
    });
  }
}

export function getStatusSnapshot(eslCode) {
  return snapshotsByEslCode.get(eslCode) ?? null;
}

export function listStatusSnapshots() {
  return Array.from(snapshotsByEslCode.values());
}

export function getStatusSummary() {
  let online_count = 0;
  let offline_count = 0;

  for (const snapshot of snapshotsByEslCode.values()) {
    if (snapshot.online === 1 || snapshot.online === true) {
      online_count += 1;
    } else {
      offline_count += 1;
    }
  }

  return {
    online_count,
    offline_count,
    total_count: online_count + offline_count,
    updated_at: new Date().toISOString()
  };
}

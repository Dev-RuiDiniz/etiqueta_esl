// Repositório em memória para trilha de auditoria de comandos enviados ao ESL.
const commandLogs = [];

function buildId(prefix) {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${Date.now()}-${random}`;
}

export function addCommandLog(entry) {
  const record = {
    id: buildId('CMD'),
    created_at: new Date().toISOString(),
    ...entry
  };

  commandLogs.unshift(record);

  if (commandLogs.length > 5000) {
    commandLogs.length = 5000;
  }

  return record;
}

export function listCommandLogs(limit = 100) {
  return commandLogs.slice(0, Math.max(1, limit));
}

export function findCommandByRequestId(requestId) {
  return commandLogs.find((item) => item.request_id === requestId) ?? null;
}
